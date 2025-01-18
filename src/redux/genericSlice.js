import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {};

// Create the slice
const genericSlice = createSlice({
  name: 'generic',
  initialState,
  reducers: {
    fetchData: (state, action) => {
      const { key, data } = action.payload;
      state[key] = data; // Directly update the state for the specified key
    },
    addData: (state, action) => {
      const { key, item, index = 0 } = action.payload;
      if (!Array.isArray(state[key])) {
        state[key] = []; // Ensure the state is an array
      }
      state[key].splice(index, 0, item); // Insert the item at the specified index
    },
    updateData: (state, action) => {
      const { key, item } = action.payload;
      if (Array.isArray(state[key])) {
        state[key] = state[key].map(existingItem =>
          existingItem.Id === item.Id ? item : existingItem
        );
      }
    },
  },
});

// Export actions and reducer
export const { fetchData, addData, updateData } = genericSlice.actions;
export default genericSlice.reducer;
