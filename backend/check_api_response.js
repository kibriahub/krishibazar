const http = require('http');

const checkAPI = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/products?limit=4',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('API Response:');
        console.log(JSON.stringify(response, null, 2));
        
        console.log('\nProduct Images:');
        response.data.forEach(product => {
          console.log(`${product.name}: ${JSON.stringify(product.images)}`);
        });
      } catch (error) {
        console.error('Error parsing response:', error.message);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Error:', error.message);
  });
  
  req.end();
};

checkAPI();