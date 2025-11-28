import { describe, it, expect, vi } from 'vitest';
import * as updateMod from '../src/update.js';
import * as configMod from '../src/config.js';
import { cli } from '../src/cli.js';

describe('cli routing', () => {
  it('calls update when command is update', async () => {
    const updateSpy = vi.spyOn(updateMod, 'update').mockImplementation(async () => 'updated');

    // Simulate process argv with 'update' command
    const originalArgv = process.argv;
    process.argv = ['node', 'cli', 'update'];

    // Call cli
    await cli();

    expect(updateSpy).toHaveBeenCalled();

    // Restore argv and spy
    process.argv = originalArgv;
    updateSpy.mockRestore();
  });

  it('exits when existing project is detected and no command', async () => {
    // Mock configExists to return true
    const spyCfg = vi.spyOn(configMod, 'configExists').mockResolvedValue(true);

    const originalArgv = process.argv;
    process.argv = ['node', 'cli'];

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});

    await cli();

    expect(exitSpy).toHaveBeenCalledWith(0);

    exitSpy.mockRestore();
    process.argv = originalArgv;
    spyCfg.mockRestore();
  });
});
