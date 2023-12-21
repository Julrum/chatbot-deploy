import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

export function runCommand(command: string, args: string[] = []): Promise<string> {
    return new Promise((resolve, reject) => {
        const child: ChildProcessWithoutNullStreams = spawn(command, args);

        child.stdout.on('data', (data: Buffer) => {
            console.log(`stdout: ${data.toString()}`);
        });

        child.stderr.on('data', (data: Buffer) => {
            console.error(`stderr: ${data.toString()}`);
        });

        child.on('close', (code: number) => {
            if (code === 0) {
                resolve(`child process exited with code ${code}`);
            } else {
                reject(new Error(`child process exited with code ${code}`));
            }
        });

        child.on('error', (err: Error) => {
            reject(err);
        });
    });
}
