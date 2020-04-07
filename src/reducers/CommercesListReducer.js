import {
  ON_FAVORITE_COMMERCE_DELETED,
  ON_FAVORITE_COMMERCE_ADDED,
  ON_ONLY_FAVORITE_COMMERCES_READ,
  ON_ONLY_FAVORITE_COMMERCES_READING,
  ON_AREAS_READING,
  ON_AREAS_SEARCH_READ,
  ON_COMMERCES_LIST_VALUE_CHANGE,
  ON_COMMERCES_LIST_READING,
  ON_COMMERCES_LIST_READ,
  ON_COMMERCES_LIST_READ_FAIL
} from '../actions/types';

const INITIAL_STATE = {
  onlyFavoriteCommerces: [],
  favoriteCommerces: [],
  commerces: [],
  loading: false,
  searching: true,
  areas: [],
  provinceNameFilter: null,
  locationButtonIndex: 0,
  locationRadiusKms: 5,
  markers: []
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ON_COMMERCES_LIST_READING:
      return { ...state, searching: true };
    
    case ON_COMMERCES_LIST_READ:
      return { ...state, commerces: action.payload, searching: false };

    case ON_COMMERCES_LIST_READ_FAIL:
      return { ...state, searching: false };

    case ON_AREAS_READING:
    case ON_ONLY_FAVORITE_COMMERCES_READING:
      return { ...state, loading: true };

    case ON_COMMERCES_LIST_VALUE_CHANGE:
      return { ...state, ...action.payload };

    case ON_FAVORITE_COMMERCE_DELETED:
      const favoritesUpdate = state.favoriteCommerces.filter(element => {
        if (element !== action.payload) {
          return element;
        }
      });
      return { ...state, favoriteCommerces: favoritesUpdate };

    case ON_FAVORITE_COMMERCE_ADDED:
      const favorites = state.favoriteCommerces.concat(action.payload);
      return { ...state, favoriteCommerces: favorites };

    case ON_ONLY_FAVORITE_COMMERCES_READ:
    case ON_AREAS_SEARCH_READ:
      return { ...state, ...action.payload, loading: false };

    default:
      return state;
  }
};
