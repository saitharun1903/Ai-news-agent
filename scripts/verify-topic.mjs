async function verify() {
  const res = await fetch('http://localhost:3000/topics/llms');
  const html = await res.text();
  console.log('Status code:', res.status);
  console.log('Includes "Why It Is Trending Right Now":', html.includes('Why It Is Trending Right Now'));
  console.log('Includes "Research Reading Roadmap":', html.includes('Research Reading Roadmap'));
  console.log('Includes "Latest News":', html.includes('Latest News'));
  console.log('Includes "Research Papers":', html.includes('Research Papers'));
  console.log('Includes "What People Are Building":', html.includes('What People Are Building'));
  console.log('Includes "Active Researchers":', html.includes('Active Researchers'));
  console.log('Includes "Adjacent Technical Frontiers":', html.includes('Adjacent Technical Frontiers'));
}
verify();
