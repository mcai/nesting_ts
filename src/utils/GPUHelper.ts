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
    static test(mode: GPUMode, m: number, n: number) {
        const gpu = new GPU({
            mode: mode,
        });

        const a = Array<number[]>(m)
            .fill([])
            .map(() => Array<number>(n).fill(Math.random()));

        const b = Array<number[]>(n)
            .fill([])
            .map(() => Array<number>(m).fill(Math.random()));

        const multiplyMatrix = gpu
            .createKernel(function (a: number[][], b: number[][]) {
                let sum = 0;
                for (let i = 0; i < 512; i++) {
                    // TODO: 512 should be replaced with n
                    sum += a[this.thread.y][i] * b[i][this.thread.x];
                }
                return sum;
            })
            .setOutput([m, m]);

        const c = multiplyMatrix(a, b) as number[][];

        // console.log(c);
    }
}

const m = 512;
const n = 512;

time(`GPU_${m}_${n}`, () => GPUHelper.test("gpu", m, n));
time(`CPU_${m}_${n}`, () => GPUHelper.test("cpu", m, n));
