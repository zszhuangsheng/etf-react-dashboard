import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock the fetcher to avoid real network calls in tests
vi.mock('./fetcher.js', () => ({
  fetchMonthlyData: vi.fn().mockResolvedValue(null),
  interpolateMonthly: vi.fn((data) => data),
}));

describe('ETF Dashboard', () => {

  it('renders overview page by default', () => {
    const { container } = render(<App />);
    expect(container.querySelector('h2').textContent).toBe('概览');
  });

  it('overview page contains executive summary section', () => {
    const { container } = render(<App />);
    const allText = container.textContent;
    expect(allText).toContain('核心研究发现');
    expect(allText).toContain('收益模式差异');
    expect(allText).toContain('回撤风险特征');
    expect(allText).toContain('熊市防御优势');
    expect(allText).toContain('定投复利效应');
  });

  it('overview page contains investor age matrix', () => {
    const { container } = render(<App />);
    const allText = container.textContent;
    expect(allText).toContain('投资者年龄定位矩阵');
    expect(allText).toContain('积累期');
    expect(allText).toContain('平衡期');
    expect(allText).toContain('分配期');
    expect(allText).toContain('20–40岁');
  });

  it('can navigate to risk page and see bear market comparison', () => {
    const { container } = render(<App />);
    const riskBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('风险回调'));
    expect(riskBtn).toBeTruthy();
    fireEvent.click(riskBtn);
    const allText = container.textContent;
    expect(allText).toContain('风险回调');
    expect(allText).toContain('熊市对比');
  });

  it('risk page contains drawdown probability distribution', () => {
    const { container } = render(<App />);
    const riskBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('风险回调'));
    fireEvent.click(riskBtn);
    const allText = container.textContent;
    expect(allText).toContain('回调概率分布');
  });

  it('risk page contains recovery rules', () => {
    const { container } = render(<App />);
    const riskBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('风险回调'));
    fireEvent.click(riskBtn);
    const allText = container.textContent;
    expect(allText).toContain('关键恢复规律');
    expect(allText).toContain('恢复速度');
    expect(allText).toContain('股息缓冲');
  });

  it('buy strategy page has adjustable multiplier sliders and pyramid rules', () => {
    const { container } = render(<App />);
    const buyBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('买入策略'));
    expect(buyBtn).toBeTruthy();
    fireEvent.click(buyBtn);
    const allText = container.textContent;
    expect(allText).toContain('金字塔加仓规则');
    expect(allText).toContain('可调回调加倍倍率');
    expect(allText).toContain('金字塔策略 vs 普通DCA');
    expect(allText).toContain('金字塔市值');
    expect(allText).toContain('普通DCA市值');
    expect(allText).toContain('额外收益');
    expect(allText).toContain('收益率对比');
    // New: advice cards
    expect(allText).toContain('资金管理');
    expect(allText).toContain('纪律执行');
    expect(allText).toContain('长期视角');
  });

  it('can navigate to conclusion page', () => {
    const { container } = render(<App />);
    const concBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('投资结论'));
    expect(concBtn).toBeTruthy();
    fireEvent.click(concBtn);
    const allText = container.textContent;
    expect(allText).toContain('投资结论');
  });

  it('conclusion page has dynamic ETF comparison', () => {
    const { container } = render(<App />);
    const concBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('投资结论'));
    fireEvent.click(concBtn);
    const allText = container.textContent;
    // Default ticker is SPY, so it should compare SPY vs QQQ
    expect(allText).toContain('SPY');
    expect(allText).toContain('QQQ');
  });

  it('conclusion page has allocation advice and summary quote', () => {
    const { container } = render(<App />);
    const concBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('投资结论'));
    fireEvent.click(concBtn);
    const allText = container.textContent;
    expect(allText).toContain('综合配置建议');
    expect(allText).toContain('20–40岁');
    expect(allText).toContain('40–55岁');
    expect(allText).toContain('55岁+');
  });

  it('can switch ETF and data updates accordingly', () => {
    const { container } = render(<App />);
    const spyBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent.includes('SPY') && b.textContent.includes('大盘指数')
    );
    expect(spyBtn).toBeTruthy();
    fireEvent.click(spyBtn);
    const allText = container.textContent;
    expect(allText).toContain('SPY');
    expect(allText).toContain('SPDR S&P 500 ETF');
  });

  it('all nav items are present including buy strategy', () => {
    const { container } = render(<App />);
    const navLabels = ['概览', '收益分析', '风险回调', '买入策略', '持仓分析', '横向对比', '退休规划', '投资结论'];
    const allText = container.textContent;
    navLabels.forEach(label => {
      expect(allText).toContain(label);
    });
  });

  it('holdings page renders as proper component with pie chart', () => {
    const { container } = render(<App />);
    const holdBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('持仓分析'));
    expect(holdBtn).toBeTruthy();
    fireEvent.click(holdBtn);
    const allText = container.textContent;
    expect(allText).toContain('持仓分析');
    expect(allText).toContain('行业分布');
    expect(allText).toContain('前10大持仓');
    expect(allText).toContain('个股深度指标');
    expect(allText).toContain('股息连续增长年数');
  });

  it('retirement page has enhanced charts and table', () => {
    const { container } = render(<App />);
    const retBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('退休规划'));
    expect(retBtn).toBeTruthy();
    fireEvent.click(retBtn);
    const allText = container.textContent;
    expect(allText).toContain('退休规划');
    expect(allText).toContain('月股息收入预测');
    expect(allText).toContain('Yield on Cost 复利效应');
    expect(allText).toContain('逐年详细数据表');
    expect(allText).toContain('假设基础');
    expect(allText).toContain('未计入的成本');
    expect(allText).toContain('最大的变量');
  });
});
