import { vi } from 'vitest';

vi.mock('./utils', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getBusinessMinutes: vi.fn(),
    };
});
