import { ON_LOCATION_VALUE_CHANGE, ON_SELECTED_LOCATION_CHANGE, ON_LOCATION_VALUES_RESET } from './types';

export const onLocationValueChange = payload => ({ type: ON_LOCATION_VALUE_CHANGE, payload });

export const onSelectedLocationChange = location => ({ type: ON_SELECTED_LOCATION_CHANGE, payload: location });

export const onLocationValuesReset = () => ({ type: ON_LOCATION_VALUES_RESET });
