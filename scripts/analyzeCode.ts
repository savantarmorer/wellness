import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { analyzeFunctionCalls, printFunctionCallGraph } from '../src/utils/codeAnalyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Analyze the src directory
const calls = analyzeFunctionCalls(projectRoot);
printFunctionCallGraph(calls);

// You can also filter calls to specific functions or from specific files
const filteredCalls = calls.filter(call => 
  call.filePath.includes('services') || 
  call.callee.includes('analyze') ||
  call.callee.includes('assess')
);

console.log('\nFiltered Function Calls (Services and Analysis related):');
console.log('---------------------------------------------------');
printFunctionCallGraph(filteredCalls); 