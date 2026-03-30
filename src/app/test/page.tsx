export default function TestPage() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: '#1a1814', color: '#d4a017', padding: '14px 32px', flexShrink: 0 }}>
        Header
      </div>

      {/* Body row */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: '#1a1814', flexShrink: 0 }}>Sidebar</div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Input zone */}
          <div style={{ background: '#ede9e0', padding: 18, flexShrink: 0 }}>Input Zone</div>

          {/* Output - THIS must scroll */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {Array.from({ length: 50 }, (_, i) => (
              <p key={i} style={{ margin: '10px 0' }}>
                Line {i + 1}: 这是一段测试文字，用来验证滚动功能是否正常工作。
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
