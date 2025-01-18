import { configureStore } from '@reduxjs/toolkit';
import genericReducer from './genericSlice'; // Update the path as necessary

const store = configureStore({
  reducer: {
    generic: genericReducer, // Add the generic reducer
  },
});

export default store;
