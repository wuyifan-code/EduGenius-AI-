import * as dotenv from 'dotenv';
dotenv.config();

async function testMiniMax() {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey || apiKey === 'your_minimax_key_here') {
    console.error('❌ 测试终止: 请先配置真实的 MINIMAX_API_KEY');
    return;
  }

  console.log('🔄 正在请求 [MiniMax-M2.7] (包含 Reasoning 思考能力)...');
  try {
    const response = await fetch('https://api.minimaxi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hi, how are you?' }
        ],
        reasoning_split: true
      })
    });

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      const msg = data.choices[0].message;
      console.log('✅ 测试成功！');
      if (msg.reasoning_details && msg.reasoning_details.length > 0) {
        console.log('🧠 Thinking:\n' + msg.reasoning_details[0].text);
      }
      console.log('\n💬 Text:\n' + msg.content);
    } else {
      console.error('❌ 报错：', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ 网络报错：', err);
  }
}
testMiniMax();
