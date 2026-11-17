// @orca-managed-pi-extension
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

export default function (pi: any) {
  if (typeof pi?.registerCommand !== 'function') return;

  const register = (cmdName: string) => {
    pi.registerCommand(cmdName, {
      description: 'Khắc phục và tự phục hồi toàn diện 9Router & client harnesses (cổng 20129, locks, base URL)',
      handler: async (args: string, ctx: any) => {
        const candidatePaths = [
          path.join(os.homedir(), '.omp', 'agent', 'skills', 'fix-9router-harnesses', 'scripts', 'fix.js'),
          path.join(os.homedir(), '.pi', 'agent', 'skills', 'fix-9router-harnesses', 'scripts', 'fix.js'),
          path.join(os.homedir(), '.config', 'opencode', 'skills', 'fix-9router-harnesses', 'scripts', 'fix.js'),
        ];
        const scriptPath = candidatePaths.find((p) => fs.existsSync(p));

        if (!scriptPath) {
          ctx?.ui?.notify?.('Không tìm thấy file fix.js của skill fix-9router-harnesses', 'error');
          return;
        }

        ctx?.ui?.notify?.('Đang chạy tự động khắc phục 9Router & harnesses...', 'info');

        try {
          const splitArgs = args ? args.trim().split(/\s+/).filter(Boolean) : [];
          const output = execFileSync('node', ['--experimental-sqlite', scriptPath, ...splitArgs], {
            encoding: 'utf8',
            timeout: 60000,
          });

          // Print output to console / terminal
          console.log('\n' + output);

          if (ctx?.ui?.notify) {
            ctx.ui.notify('Đã khắc phục xong 9Router & harnesses! Xem chi tiết trong terminal.', 'success');
          }
        } catch (err: any) {
          console.error(err);
          if (ctx?.ui?.notify) {
            ctx.ui.notify('Lỗi khi chạy fix-9router: ' + err.message, 'error');
          }
        }
      },
    });
  };

  register('fix-9router');
  register('9router-fix');
}
