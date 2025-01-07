import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

interface FunctionCall {
  caller: string;
  callee: string;
  filePath: string;
  line: number;
}

function getSourceFiles(projectPath: string): string[] {
  const files: string[] = [];
  
  function walkDir(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist') {
          walkDir(fullPath);
        }
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(projectPath);
  return files;
}

function getLineNumber(node: ts.Node, sourceFile: ts.SourceFile): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
}

function findFunctionName(node: ts.Node): string {
  if (ts.isFunctionDeclaration(node) && node.name) {
    return node.name.text;
  }
  if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
    return node.name.text;
  }
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
    return node.name.text;
  }
  return 'anonymous';
}

function findParentFunction(node: ts.Node): string {
  while (node) {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
      return findFunctionName(node);
    }
    node = node.parent;
  }
  return 'global';
}

export function analyzeFunctionCalls(projectPath: string): FunctionCall[] {
  console.log('Starting analysis...');
  console.log('Project path:', projectPath);
  
  try {
    const sourceFiles = getSourceFiles(path.join(projectPath, 'src'));
    console.log(`Found ${sourceFiles.length} source files`);
    
    const functionCalls: FunctionCall[] = [];
    
    for (const filePath of sourceFiles) {
      console.log(`Processing file: ${filePath}`);
      
      try {
        const sourceText = fs.readFileSync(filePath, 'utf-8');
        const sourceFile = ts.createSourceFile(
          filePath,
          sourceText,
          ts.ScriptTarget.Latest,
          true
        );
        
        function visit(node: ts.Node) {
          if (ts.isCallExpression(node)) {
            try {
              let callee = '<unknown>';
              if (ts.isIdentifier(node.expression)) {
                callee = node.expression.text;
              } else if (ts.isPropertyAccessExpression(node.expression)) {
                if (ts.isIdentifier(node.expression.name)) {
                  callee = node.expression.name.text;
                }
              }
              
              const caller = findParentFunction(node);
              const line = getLineNumber(node, sourceFile);
              
              functionCalls.push({
                caller,
                callee,
                filePath,
                line
              });
            } catch (error) {
              console.error('Error processing call:', error);
            }
          }
          
          ts.forEachChild(node, visit);
        }
        
        visit(sourceFile);
      } catch (error) {
        console.error('Error processing file:', filePath, error);
      }
    }
    
    console.log(`Analysis complete. Found ${functionCalls.length} function calls.`);
    return functionCalls;
    
  } catch (error) {
    console.error('Error during analysis:', error);
    return [];
  }
}

export function printFunctionCallGraph(calls: FunctionCall[]): void {
  console.log('\nFunction Call Graph:');
  console.log('-------------------');
  
  if (calls.length === 0) {
    console.log('No function calls found.');
    return;
  }
  
  // Group by file for better readability
  const callsByFile = new Map<string, FunctionCall[]>();
  calls.forEach(call => {
    const calls = callsByFile.get(call.filePath) || [];
    calls.push(call);
    callsByFile.set(call.filePath, calls);
  });
  
  callsByFile.forEach((calls, file) => {
    console.log(`\nFile: ${file}`);
    console.log('-------------------');
    calls.forEach(call => {
      console.log(`${call.caller} -> ${call.callee} (line ${call.line})`);
    });
  });
}

// Example usage:
// const calls = analyzeFunctionCalls('./');
// printFunctionCallGraph(calls); 