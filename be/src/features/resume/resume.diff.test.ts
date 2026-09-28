import { describe, expect, it } from 'vitest';
import { resumeDiffService } from './resumeDiff.service';

describe('resumeDiffService', () => {
  it('reports an added field', () => {
    expect(resumeDiffService.diff({ name: 'Ada' }, { name: 'Ada', title: 'Engineer' })).toEqual([
      { type: 'added', path: '/title', value: 'Engineer' },
    ]);
  });

  it('reports a removed field', () => {
    expect(resumeDiffService.diff({ name: 'Ada', title: 'Engineer' }, { name: 'Ada' })).toEqual([
      { type: 'removed', path: '/title', value: 'Engineer' },
    ]);
  });

  it('reports a modified field', () => {
    expect(resumeDiffService.diff({ title: 'Engineer' }, { title: 'Senior Engineer' })).toEqual([
      { type: 'modified', path: '/title', oldValue: 'Engineer', newValue: 'Senior Engineer' },
    ]);
  });

  it('reports a nested object modification', () => {
    expect(
      resumeDiffService.diff(
        { person: { name: 'Ada' } },
        { person: { name: 'Grace' } },
      ),
    ).toEqual([
      { type: 'modified', path: '/person/name', oldValue: 'Ada', newValue: 'Grace' },
    ]);
  });

  it('reports an array modification', () => {
    expect(
      resumeDiffService.diff(
        { experience: [{ company: 'Innodata', title: 'Engineer' }] },
        { experience: [{ company: 'Innodata', title: 'Senior Engineer' }, { company: 'ABC', title: 'Lead' }] },
      ),
    ).toEqual([
      {
        type: 'modified',
        path: '/experience/0/title',
        oldValue: 'Engineer',
        newValue: 'Senior Engineer',
      },
      {
        type: 'added',
        path: '/experience/1',
        value: { company: 'ABC', title: 'Lead' },
      },
    ]);
  });
});
