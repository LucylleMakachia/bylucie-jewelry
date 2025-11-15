import { safeCollectionCount, safeAggregate } from './dbHelpers.js';

describe('Helpers utility functions', () => {
  // Example test for safeCollectionCount
  describe('safeCollectionCount', () => {
    test('returns 0 and logs warning when DB is not connected', async () => {
      // You would mock mongoose connection readyState = 0 here and test the function returns 0
    });
    test('returns count of documents when connected and collection exists', async () => {
      // Mock mongoose connection and countDocuments here and test the function returns correct count
    });
  });

  // Example test for safeAggregate
  describe('safeAggregate', () => {
    test('returns empty array and logs warning when DB is not connected', async () => {
      // Mock mongo connection readyState = 0 and test return []
    });
    test('returns aggregation results when connected and collection exists', async () => {
      // Mock mongo connection and aggregate pipeline here and test results returned correctly
    });
  });
});
