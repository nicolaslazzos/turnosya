import React from 'react';
import { createAppContainer } from 'react-navigation';
import { createDrawerNavigator } from 'react-navigation-drawer';
import { createStackNavigator, HeaderBackButton } from 'react-navigation-stack';
import { SportsNavigation, SportsEmployeesNavigation, HairdressersNavigation, HairdressersEmployeesNavigation } from './CommerceNavigation';
import CommerceDrawerContent from './CommerceDrawerContent';
import CommerceSettings from '../components/commerce/CommerceSettings';
import PaymentSettings from '../components/commerce/PaymentSettings';
import PaymentSettingsWeb from '../components/commerce/PaymentSettingsWeb';
import EmployeesList from '../components/commerce/EmployeesList';
import EmployeeForm from '../components/commerce/EmployeeForm';
import Help from '../components/Help';
import { stackNavigationOptions, drawerNavigationOptions } from './NavigationOptions';
import NotificationsList from '../components/NotificationsList';

const CommerceSettingsStack = createStackNavigator(
  {
    settings: {
      screen: CommerceSettings,
      navigationOptions: ({ navigation }) => ({
        title: 'Configuración',
        headerLeft: <HeaderBackButton onPress={() => navigation.goBack(null)} tintColor="white" title="Back" />
      })
    },
    paymentSettings: {
      screen: PaymentSettings,
      navigationOptions: {
        title: 'Cobro con Mercado Pago'
      }
    },
    paymentSettingsWeb: {
      screen: PaymentSettingsWeb,
      navigationOptions: {
        title: 'Cobro con Mercado Pago'
      }
    }
  },
  stackNavigationOptions
);

const CommerceEmployeesStack = createStackNavigator(
  {
    employeesList: {
      screen: EmployeesList,
      navigationOptions: ({ navigation }) => ({
        title: 'Empleados',
        headerLeft: <HeaderBackButton onPress={() => navigation.goBack(null)} tintColor="white" title="Back" />
      })
    },
    employeeForm: {
      screen: EmployeeForm,
      navigationOptions: {
        title: 'Empleado'
      }
    }
  },
  stackNavigationOptions
);

const CommerceNotificationsStack = createStackNavigator(
  {
    commerceNotificationslist: {
      screen: NotificationsList,
      navigationOptions: ({ navigation }) => ({
        title: 'Notificaciones',
        headerLeft: <HeaderBackButton onPress={() => navigation.goBack(null)} tintColor="white" title="Back" />
      })
    }
  },
  stackNavigationOptions
);

const CommerceHelpStack = createStackNavigator(
  {
    commerceHelp: {
      screen: Help,
      navigationOptions: ({ navigation }) => ({
        title: 'Ayuda',
        headerLeft: <HeaderBackButton onPress={() => navigation.goBack(null)} tintColor="white" title="Back" />
      })
    }
  },
  stackNavigationOptions
);

const commonNavigations = {
  commerceSettings: CommerceSettingsStack,
  commerceEmployees: CommerceEmployeesStack,
  commerceNotifications: CommerceNotificationsStack,
  commerceHelp: CommerceHelpStack
};

// DRAWER FOR SPORTS COMMERCES
const sportsDrawer = createDrawerNavigator(
  {
    sportsNavigation: SportsNavigation,
    ...commonNavigations
  },
  {
    ...drawerNavigationOptions,
    contentComponent: CommerceDrawerContent
  }
);

// DRAWER FOR SPORTS COMMERCES (EMPLOYEES)
const sportsEmployeesDrawer = createDrawerNavigator(
  {
    sportsNavigation: SportsEmployeesNavigation,
    ...commonNavigations
  },
  {
    ...drawerNavigationOptions,
    contentComponent: CommerceDrawerContent
  }
);

// DRAWER FOR HAIRDRESSERS COMMERCES
const hairdressersDrawer = createDrawerNavigator(
  {
    hairdressersNavigation: HairdressersNavigation,
    ...commonNavigations
  },
  {
    ...drawerNavigationOptions,
    contentComponent: CommerceDrawerContent
  }
);

// DRAWER FOR HAIRDRESSERS COMMERCES (EMPLOYEES)
const hairdressersEmployeesDrawer = createDrawerNavigator(
  {
    hairdressersNavigation: HairdressersEmployeesNavigation,
    ...commonNavigations
  },
  {
    ...drawerNavigationOptions,
    contentComponent: CommerceDrawerContent
  }
);

const SportsDrawer = createAppContainer(sportsDrawer);
const SportsEmployeesDrawer = createAppContainer(sportsEmployeesDrawer);
const HairdressersDrawer = createAppContainer(hairdressersDrawer);
const HairdressersEmployeesDrawer = createAppContainer(hairdressersEmployeesDrawer);

export { SportsDrawer, SportsEmployeesDrawer, HairdressersDrawer, HairdressersEmployeesDrawer };
