import { GPU, GPUMode } from "gpu.js";

function time(name: string, func: () => any) {
    const start = new Date().getTime();

    const result = func();

    const end = new Date().getTime();
    const time = end - start;

    console.log(`[${name}] It took ${time} ms.`);

    return result;
}

export class GPUHelper {
    static test(mode: GPUMode, m: number, n: number, k: number, a: number[][], b: number[][]): number[][] {
        const gpu = new GPU({
            mode: mode,
        });

        const multiplyMatrix = gpu
            .createKernel(function (a: number[][], b: number[][]) {
                let sum = 0;
                for (let i = 0; i < this.constants.n; i++) {
                    sum += a[this.thread.y][i] * b[i][this.thread.x];
                }
                return sum;
            })
            .setOutput([m, k])
            .setConstants({ n: n });

        return multiplyMatrix(a, b) as number[][];
    }
}

const m = 2048;
const n = 2048;
const k = 2048;

const a = Array<number[]>(m)
    .fill([])
    .map(() => Array<number>(n).fill(Math.random()));

const b = Array<number[]>(n)
    .fill([])
    .map(() => Array<number>(k).fill(Math.random()));

const resultGPU = time(`GPU_${m}_${n}_${k}`, () => GPUHelper.test("gpu", m, n, k, a, b));
const resultCPU = time(`CPU_${m}_${n}_${k}`, () => GPUHelper.test("cpu", m, n, k, a, b));

for (let i = 0; i < m; i++) {
    for (let j = 0; j < k; j++) {
        const result1 = resultGPU[i][j];
        const result2 = resultCPU[i][j];

        if (Math.abs(result1 - result2) >= 0.01) {
            throw new Error(`resultGPU[${i}][${j}](${result1}) !== resultCPU[${i}][${j}](${result2})`);
        }
    }
}

console.log("resultGPU = resultCPU");

// example result:
// [GPU_2048_2048] It took 2520 ms.
// [CPU_2048_2048] It took 102008 ms.
// resultGPU = resultCPU
