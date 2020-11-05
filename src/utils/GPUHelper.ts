import { GPU } from "gpu.js";

export class GPUHelper {
    static test() {
        const gpu = new GPU();

        const a = Array(512).map(() => Array(512).fill(Math.random()));
        const b = Array(512).map(() => Array(512).fill(Math.random()));

        const multiplyMatrix = gpu
            .createKernel(function (a: number[][], b: number[][]) {
                let sum = 0;
                for (let i = 0; i < 512; i++) {
                    sum += a[this.thread.y][i] * b[i][this.thread.x];
                }
                return sum;
            })
            .setOutput([512, 512]);

        const c = multiplyMatrix(a, b) as number[][];

        console.log(c);
    }
}

GPUHelper.test();
