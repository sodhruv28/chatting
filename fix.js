const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = fs.readdirSync(dir);
  for (let file of files) {
    let p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.js') || p.endsWith('.jsx')) {
      let content = fs.readFileSync(p, 'utf-8');
      if (content.includes('http://localhost:5000')) {
        // Find URLs inside template strings first and ignore them if already processed
        // For everything else, replace with dynamic API url.
        // It's safer to just replace 'http://localhost:5000' with \ inside backticks
        // Let's replace "http://localhost:5000" and http://localhost:5000 with the correct string
        
        let newContent = content.replace(/"http:\/\/localhost:5000/g, '${import.meta.env.VITE_API_URL || "http://localhost:5000"}' );
        // fix the ending quotes correctly depending on where they are
        newContent = newContent.replace(/localhost:5000"([^]*)"/g, 'localhost:5000"}');
        
        fs.writeFileSync(p, newContent);
      }
    }
  }
}
walk('client/src');
