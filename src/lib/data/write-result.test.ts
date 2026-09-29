import { describe, expect, it } from 'vitest';
import { resultFromWrite } from './write-result';

describe('resultFromWrite', () => {
  it('reports success only when the write returned rows and no error', () => {
    expect(
      resultFromWrite(
        { error: null, rowCount: 1 },
        'Subscription set to cancel.',
        'Could not update the subscription.',
      ),
    ).toEqual({ success: true, message: 'Subscription set to cancel.' });
  });

  it('reports failure when Postgres returns an error', () => {
    expect(
      resultFromWrite(
        { error: { message: 'permission denied' }, rowCount: 0 },
        'Subscription set to cancel.',
        'Could not update the subscription.',
      ),
    ).toEqual({ success: false, message: 'Could not update the subscription.' });
  });

  it('reports failure when row level security updates nothing', () => {
    expect(
      resultFromWrite(
        { error: null, rowCount: 0 },
        'Subscription set to cancel.',
        'Could not update the subscription.',
      ).success,
    ).toBe(false);
  });
});
