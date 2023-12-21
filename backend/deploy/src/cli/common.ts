import {createInterface} from "readline";


export function question(questionText: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise<string>(resolve => rl.question(questionText, resolve))
    .then((answer) => {
      if (!answer || answer.length === 0) {
        if (!defaultValue) {
          throw new Error(`Got invalid user input: ${answer}, without default`);
        }
        return defaultValue;
      }
      return answer;
    })
    .finally(() => rl.close());
}

export const quits = ["exit", "quit", "q", "bye"];