import React from 'react';
import { createAppContainer } from 'react-navigation';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import { createStackNavigator, HeaderBackButton } from 'react-navigation-stack';
import { IconButton } from '../components/common';
import ClientProfile from '../components/client/ClientProfile';
import CommercesList from '../components/client/CommercesList';
import FavoriteCommercesList from '../components/client/FavoriteCommercesList';
import { stackNavigationOptions, tabNavigationOptions } from './NavigationOptions';
import CommercesAreas from '../components/client/CommercesAreas';
import ClientCourtsSchedule from '../components/client/ClientCourtsSchedule';
import CommerceCourtsList from '../components/client/CommerceCourtsList';
import ConfirmCourtReservation from '../components/client/ConfirmCourtReservation';
import ClientReservationsList from '../components/client/ClientReservationsList';
import ClientReservationDetails from '../components/client/ClientReservationDetails';
import CommercesFiltersScreen from '../components/client/CommercesFiltersScreen';
import CommercesFiltersMap from '../components/client/CommercesFiltersMap';
import PaymentForm from '../components/client/PaymentForm';
import CommercesMap from '../components/common/CommercesMap';
import CommerceLocationMap from '../components/common/CommerceLocationMap';
import PaymentDetails from '../components/PaymentDetails';
import ClientReviewsList from '../components/ClientReviewsList';
import CommerceProfileView from '../components/CommerceProfileView';
import CommerceProfileInfo from '../components/CommerceProfileInfo';
import CommerceReviewsList from '../components/CommerceReviewsList';
import CommerceServicesList from '../components/client/CommerceServicesList';
import CommerceEmployeesList from '../components/client/CommerceEmployeesList';
import ClientServicesSchedule from '../components/client/ClientServicesSchedule';
import ConfirmServiceReservation from '../components/client/ConfirmServiceReservation';

// Aca hay un stack por cada tab que tiene el tab navigation

const filtersStack = createStackNavigator(
  {
    commercesFiltersScreen: {
      screen: CommercesFiltersScreen,
      navigationOptions: {
        headerStyle: {
          ...stackNavigationOptions.defaultNavigationOptions.headerStyle,
          borderBottomWidth: 0,
          elevation: 0
        }
      }
    },
    commercesFiltersMap: {
      screen: CommercesFiltersMap,
      navigationOptions: {
        title: 'Seleccionar ubicación'
      }
    }
  },
  {
    ...stackNavigationOptions,
    mode: 'modal' // necesito iOS para ver si funca esto (Nico)
  }
);

const onCommerceProfileGoBack = navigation => {
  const navigatedFrom = navigation.getParam('navigatedFrom');

  navigation.goBack();

  if (navigatedFrom === 'favoritesList') navigation.navigate(navigatedFrom);
};

const searchStack = createStackNavigator(
  {
    commercesAreas: {
      screen: CommercesAreas,
      navigationOptions: ({ navigation }) => ({
        title: 'Buscar Negocios',
        headerLeft: <IconButton icon="md-menu" onPress={navigation.openDrawer} />
      })
    },
    commercesList: {
      screen: CommercesList,
      navigationOptions: {
        title: 'Buscar Negocios'
      }
    },
    commercesListMap: {
      screen: CommercesMap,
      navigationOptions: {
        title: 'Buscar Negocios'
      }
    },
    commerceProfileView: {
      screen: CommerceProfileView,
      navigationOptions: ({ navigation }) => ({
        title: 'Perfil',
        headerLeft: (
          <HeaderBackButton tintColor="white" title="Back" onPress={() => onCommerceProfileGoBack(navigation)} />
        )
      })
    },
    commerceProfileInfo: {
      screen: CommerceProfileInfo,
      navigationOptions: {
        title: 'Información'
      }
    },
    commerceLocationMap: {
      screen: CommerceLocationMap,
      navigationOptions: {
        title: 'Dirección'
      }
    },
    commerceServicesList: {
      screen: CommerceServicesList,
      navigationOptions: {
        title: 'Servicios'
      }
    },
    commerceEmployeesList: {
      screen: CommerceEmployeesList,
      navigationOptions: {
        title: 'Estilistas'
      }
    },
    commerceCourtsSchedule: {
      screen: ClientCourtsSchedule,
      navigationOptions: {
        title: 'Turnos Disponibles'
      }
    },
    commerceServicesSchedule: {
      screen: ClientServicesSchedule,
      navigationOptions: {
        title: 'Turnos Disponibles'
      }
    },
    commerceCourtsList: {
      screen: CommerceCourtsList
    },
    confirmCourtReservation: {
      screen: ConfirmCourtReservation,
      navigationOptions: {
        title: 'Turno'
      }
    },
    confirmServiceReservation: {
      screen: ConfirmServiceReservation,
      navigationOptions: {
        title: 'Turno'
      }
    },
    commerceReviewsList: {
      screen: CommerceReviewsList,
      navigationOptions: {
        title: 'Reseñas del Negocio'
      }
    },
    filtersStack: {
      screen: filtersStack,
      navigationOptions: {
        header: null
      }
    }
  },
  stackNavigationOptions
);

searchStack.navigationOptions = ({ navigation }) => {
  let tabBarVisible;

  if (navigation.state.routes.length > 1) {
    navigation.state.routes.map(route => {
      if (route.routeName === 'filtersStack') {
        tabBarVisible = false;
      } else {
        tabBarVisible = true;
      }
    });
  }

  return { tabBarVisible };
};

const calendarStack = createStackNavigator(
  {
    reservations: {
      screen: ClientReservationsList,
      navigationOptions: ({ navigation }) => ({
        title: 'Mis Turnos',
        headerLeft: <IconButton icon="md-menu" onPress={navigation.openDrawer} />
      })
    },
    reservationDetails: {
      screen: ClientReservationDetails,
      navigationOptions: {
        title: 'Detalle del Turno'
      }
    },
    paymentForm: {
      screen: PaymentForm,
      navigationOptions: {
        title: 'Pagar'
      }
    },
    paymentDetails: {
      screen: PaymentDetails,
      navigationOptions: {
        title: 'Detalles del Pago'
      }
    }
  },
  stackNavigationOptions
);

const favoritesStack = createStackNavigator(
  {
    favoritesList: {
      screen: FavoriteCommercesList,
      navigationOptions: ({ navigation }) => ({
        title: 'Favoritos',
        headerLeft: <IconButton icon="md-menu" onPress={navigation.openDrawer} />
      })
    }
  },
  stackNavigationOptions
);

const profileStack = createStackNavigator(
  {
    profile: {
      screen: ClientProfile,
      navigationOptions: ({ navigation }) => ({
        title: 'Perfil',
        headerLeft: navigation.getParam('leftIcon') || <IconButton icon="md-menu" onPress={navigation.openDrawer} />
      })
    },
    clientReviewsList: {
      screen: ClientReviewsList,
      navigationOptions: {
        title: 'Reseñas del Cliente'
      }
    }
  },
  stackNavigationOptions
);

// Aca se define el tab navigation y se agrega el stack correspondiente en cada tab

const clientTabs = createBottomTabNavigator(
  {
    search: searchStack,
    calendar: calendarStack,
    favorites: favoritesStack,
    profile: profileStack
  },
  {
    ...tabNavigationOptions,
    initialRouteName: 'search'
  }
);

const ClientNavigation = createAppContainer(clientTabs);

export default ClientNavigation;
