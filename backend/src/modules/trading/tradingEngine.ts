import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { config } from '../../config';
import { logAuditAction } from '../../middleware/auth';

export interface TradeOrderRequest {
  strategyId: string;
  marketType: 'CRYPTO' | 'FOREX';
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  orderType?: 'MARKET' | 'LIMIT';
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface ExchangeAdapter {
  name: string;
  marketType: 'CRYPTO' | 'FOREX';
  executeOrder(order: TradeOrderRequest): Promise<{ executedPrice: number; providerTxId: string }>;
  fetchMarketPrice(symbol: string): Promise<number>;
}

/**
 * Mock Institutional Crypto Exchange Adapter (e.g. Binance Institutional / Coinbase Prime)
 */
export class MockCryptoExchangeAdapter implements ExchangeAdapter {
  name = 'BINANCE_INSTITUTIONAL_ADAPTER';
  marketType: 'CRYPTO' = 'CRYPTO';

  private mockPrices: Record<string, number> = {
    'BTC/USDT': 64250.00,
    'ETH/USDT': 2680.50,
    'SOL/USDT': 152.20
  };

  async fetchMarketPrice(symbol: string): Promise<number> {
    const basePrice = this.mockPrices[symbol] || 100.0;
    // Add realistic subtle micro-fluctuation (+/- 0.15%)
    const drift = (Math.random() - 0.5) * 0.003 * basePrice;
    return parseFloat((basePrice + drift).toFixed(2));
  }

  async executeOrder(order: TradeOrderRequest) {
    const executedPrice = await this.fetchMarketPrice(order.symbol);
    return {
      executedPrice,
      providerTxId: `CRYPTO-ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
  }
}

/**
 * Mock Regulated Forex Prime Broker Adapter (e.g. LMAX / Saxo / Interactive Brokers)
 */
export class MockForexBrokerAdapter implements ExchangeAdapter {
  name = 'LMAX_PRIME_BROKER_ADAPTER';
  marketType: 'FOREX' = 'FOREX';

  private mockRates: Record<string, number> = {
    'EUR/USD': 1.0850,
    'GBP/USD': 1.2980,
    'USD/JPY': 148.25
  };

  async fetchMarketPrice(symbol: string): Promise<number> {
    const basePrice = this.mockRates[symbol] || 1.0;
    const drift = (Math.random() - 0.5) * 0.0004 * basePrice;
    return parseFloat((basePrice + drift).toFixed(4));
  }

  async executeOrder(order: TradeOrderRequest) {
    const executedPrice = await this.fetchMarketPrice(order.symbol);
    return {
      executedPrice,
      providerTxId: `FOREX-ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
  }
}

/**
 * Risk Engine & Execution Manager
 */
export class TradingRiskEngine {
  private cryptoAdapter = new MockCryptoExchangeAdapter();
  private forexAdapter = new MockForexBrokerAdapter();

  /**
   * Fetches current risk limits and emergency kill switch status
   */
  getRiskLimits() {
    const limits = db.get<any>('SELECT * FROM risk_limits WHERE id = ?', ['MAIN']);
    if (!limits) {
      return {
        id: 'MAIN',
        max_position_size_usd: config.DEFAULT_RISK_LIMITS.maxPositionSizeUSD,
        max_portfolio_exposure_pct: config.DEFAULT_RISK_LIMITS.maxPortfolioExposurePct,
        max_daily_loss_pct: config.DEFAULT_RISK_LIMITS.maxDailyLossPct,
        max_drawdown_pct: config.DEFAULT_RISK_LIMITS.maxDrawdownPct,
        max_open_positions: config.DEFAULT_RISK_LIMITS.maxOpenPositions,
        stop_loss_pct: config.DEFAULT_RISK_LIMITS.stopLossPct,
        trading_halted: 0,
        updated_by: 'SYSTEM',
        updated_at: new Date().toISOString()
      };
    }
    return limits;
  }

  /**
   * Emergency Shutdown Switch: "STOP ALL TRADING"
   * Activates platform-wide trade embargo.
   */
  setTradingHalt(halted: boolean, adminUser: { id: string; email: string; role: string }, reason?: string) {
    const previous = this.getRiskLimits();
    const now = new Date().toISOString();

    db.run(
      `UPDATE risk_limits
       SET trading_halted = ?, updated_by = ?, updated_at = ?
       WHERE id = 'MAIN'`,
      [halted ? 1 : 0, adminUser.email, now]
    );

    logAuditAction(
      adminUser,
      halted ? 'EMERGENCY_HALT_TRADING_ACTIVATED' : 'EMERGENCY_HALT_TRADING_DEACTIVATED',
      'RISK_ENGINE',
      'MAIN',
      { trading_halted: previous.trading_halted },
      { trading_halted: halted ? 1 : 0 },
      reason || (halted ? 'Emergency circuit breaker triggered by trading management.' : 'Trading resumed by management authorization.')
    );

    return {
      tradingHalted: halted,
      updatedBy: adminUser.email,
      timestamp: now
    };
  }

  /**
   * Updates Risk Limits parameters
   */
  updateLimits(newLimits: Partial<any>, adminUser: { id: string; email: string; role: string }) {
    const prev = this.getRiskLimits();
    const now = new Date().toISOString();

    db.run(
      `UPDATE risk_limits
       SET max_position_size_usd = COALESCE(?, max_position_size_usd),
           max_portfolio_exposure_pct = COALESCE(?, max_portfolio_exposure_pct),
           max_daily_loss_pct = COALESCE(?, max_daily_loss_pct),
           max_drawdown_pct = COALESCE(?, max_drawdown_pct),
           max_open_positions = COALESCE(?, max_open_positions),
           stop_loss_pct = COALESCE(?, stop_loss_pct),
           updated_by = ?,
           updated_at = ?
       WHERE id = 'MAIN'`,
      [
        newLimits.max_position_size_usd,
        newLimits.max_portfolio_exposure_pct,
        newLimits.max_daily_loss_pct,
        newLimits.max_drawdown_pct,
        newLimits.max_open_positions,
        newLimits.stop_loss_pct,
        adminUser.email,
        now
      ]
    );

    const updated = this.getRiskLimits();
    logAuditAction(adminUser, 'UPDATE_RISK_LIMITS', 'RISK_ENGINE', 'MAIN', prev, updated);
    return updated;
  }

  /**
   * Risk Check and Order Execution
   */
  async executeTrade(order: TradeOrderRequest, actor: { id: string; email: string; role: string }) {
    const limits = this.getRiskLimits();

    // 1. Check Circuit Breaker
    if (limits.trading_halted === 1) {
      throw new Error('TRADE BLOCKED: Emergency trading halt is currently ACTIVE. No trades can be opened.');
    }

    // 2. Check Open Positions count
    const openPos = db.get<any>(
      `SELECT COUNT(*) as count FROM trading_positions WHERE strategy_id = ? AND status = 'OPEN'`,
      [order.strategyId]
    );
    if ((openPos?.count || 0) >= limits.max_open_positions) {
      throw new Error(`TRADE BLOCKED: Maximum open position limit (${limits.max_open_positions}) reached for strategy.`);
    }

    // 3. Select appropriate adapter
    const adapter = order.marketType === 'CRYPTO' ? this.cryptoAdapter : this.forexAdapter;
    const currentPrice = await adapter.fetchMarketPrice(order.symbol);
    const positionValueUSD = order.quantity * currentPrice;

    // 4. Validate Maximum Position Size
    if (positionValueUSD > limits.max_position_size_usd) {
      throw new Error(`TRADE BLOCKED: Position size $${positionValueUSD.toFixed(2)} exceeds maximum limit $${limits.max_position_size_usd.toFixed(2)}.`);
    }

    // 5. Execute with Provider
    const execution = await adapter.executeOrder(order);
    const now = new Date().toISOString();
    const orderId = uuidv4();
    const positionId = uuidv4();

    db.transaction(() => {
      // Record order
      db.run(
        `INSERT INTO trading_orders (id, strategy_id, market_type, symbol, side, order_type, quantity, price, executed_price, status, exchange_provider, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'FILLED', ?, ?)`,
        [
          orderId,
          order.strategyId,
          order.marketType,
          order.symbol,
          order.side,
          order.orderType || 'MARKET',
          order.quantity,
          currentPrice,
          execution.executedPrice,
          adapter.name,
          now
        ]
      );

      // Record open position
      db.run(
        `INSERT INTO trading_positions (id, strategy_id, market_type, symbol, side, quantity, entry_price, current_price, unrealized_pnl, stop_loss, take_profit, status, opened_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?, ?, 'OPEN', ?)`,
        [
          positionId,
          order.strategyId,
          order.marketType,
          order.symbol,
          order.side,
          order.quantity,
          execution.executedPrice,
          execution.executedPrice,
          order.stopLoss || (execution.executedPrice * (1 - (limits.stop_loss_pct / 100))),
          order.takeProfit || null,
          now
        ]
      );
    });

    return {
      orderId,
      positionId,
      symbol: order.symbol,
      executedPrice: execution.executedPrice,
      quantity: order.quantity,
      providerTxId: execution.providerTxId,
      status: 'FILLED',
      timestamp: now
    };
  }

  /**
   * Fetches open positions for a strategy or all strategies
   */
  getOpenPositions(strategyId?: string) {
    if (strategyId) {
      return db.query('SELECT * FROM trading_positions WHERE strategy_id = ? AND status = ? ORDER BY opened_at DESC', [strategyId, 'OPEN']);
    }
    return db.query('SELECT * FROM trading_positions WHERE status = ? ORDER BY opened_at DESC', ['OPEN']);
  }

  /**
   * Fetches trade orders
   */
  getOrders(strategyId?: string) {
    if (strategyId) {
      return db.query('SELECT * FROM trading_orders WHERE strategy_id = ? ORDER BY created_at DESC LIMIT 50', [strategyId]);
    }
    return db.query('SELECT * FROM trading_orders ORDER BY created_at DESC LIMIT 50');
  }
}

export const tradingRiskEngine = new TradingRiskEngine();
