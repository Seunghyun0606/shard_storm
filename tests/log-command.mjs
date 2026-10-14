// UTF-8 stdout capture on Windows, preserving the command's exit status.
import{spawn}from'node:child_process';import{createWriteStream}from'node:fs';import{dirname,join}from'node:path';
const [file,command,...args]=process.argv.slice(2),out=createWriteStream(file,{encoding:'utf8'});
const child=spawn(command==='npm'?process.execPath:command,command==='npm'?[join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),...args]:args,{stdio:['ignore','pipe','pipe'],env:process.env});
for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{out.write(b);process.stdout.write(b);});
child.on('error',e=>{out.end(String(e));process.exitCode=1;});child.on('exit',code=>{out.end();process.exitCode=code??1;});
