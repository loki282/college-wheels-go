import { execSync } from 'child_process';
import fs from 'fs';

// Generate private key
execSync('openssl genrsa -out localhost-key.pem 2048');

// Generate certificate signing request
execSync('openssl req -new -key localhost-key.pem -out localhost.csr -subj "/CN=localhost"');

// Generate self-signed certificate
execSync('openssl x509 -req -in localhost.csr -signkey localhost-key.pem -out localhost.pem -days 365');

// Clean up CSR file
fs.unlinkSync('localhost.csr');

console.log('SSL certificates generated successfully!'); 