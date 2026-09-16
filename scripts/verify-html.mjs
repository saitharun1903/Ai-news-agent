async function verify() {
  const res = await fetch('http://localhost:3000/');
  const html = await res.text();
  console.log('Includes "Why It Matters":', html.includes('Why It Matters') || html.includes('Why it matters') || html.includes('Why This Paper'));
  console.log('Includes "Open original":', html.includes('Open original'));
  console.log('Includes "arxiv.org/pdf":', html.includes('arxiv.org/pdf'));
  console.log('Includes "ResearchPulse":', html.includes('ResearchPulse'));
  console.log('Includes "PRIMARY":', html.includes('PRIMARY'));
  console.log('Includes "LIBRARY":', html.includes('LIBRARY'));
  console.log('Includes "INSIGHTS":', html.includes('INSIGHTS'));
  console.log('Includes "DEVELOPMENTS STREAM":', html.includes('DEVELOPMENTS STREAM'));
  console.log('Includes "Today in Artificial Intelligence":', html.includes('Today in Artificial Intelligence'));
  console.log('Status code:', res.status);
}
verify();
