import React, { Component } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { Divider, ListItem } from 'react-native-elements';
import { connect } from 'react-redux';
import { Spinner, EmptyList, MenuItem, Menu } from './common';
import {
  onNotificationsRead,
  onNotificationDelete,
  onEmployeeCreate,
  onEmployeeDelete,
  onUserWorkplacesRead,
  onEmploymentInvitationConfirm,
  onSetNotificationsRead,
} from '../actions';
import { MAIN_COLOR, NOTIFICATION_TYPES } from '../constants';
import moment from 'moment';
import { notificationsToFormatString } from '../utils';

class NotificationsList extends Component {
  state = {
    optionsVisible: false,
    selectedNotification: null,
    type: null,
    confirmEmploymentVisible: false,
    isAcceptingEmployment: false
  };

  componentDidMount() {
    const type = this.props.navigation.state.routeName === 'commerceNotificationslist' ? 'commerce' : 'client';
    this.willBlurSubscription = this.props.navigation.addListener('willBlur', () => this.onSetNotificationsRead());
    this.setState({ type }, this.onNotificationsRead);
  }

  onSetNotificationsRead = () => {
    const { notifications } = this.props;
    onSetNotificationsRead(notifications);
  };

  componentWillUnmount() {
    this.willBlurSubscription.remove && this.willBlurSubscription.remove();
  }

  onNotificationsRead = () => {
    if (this.state.type === 'client') this.props.onNotificationsRead({ profileId: this.props.profileId });
    else this.props.onNotificationsRead({ commerceId: this.props.commerceId });
  };

  onNotificationDeletePress = () => {
    this.props.onNotificationDelete(this.state.selectedNotification.id);
    this.setState({ optionsVisible: false });
  };

  onOptionsPress = selectedNotification => {
    this.setState({ selectedNotification, optionsVisible: true });
  };

  onEmploymentConfirmPress = () => {
    const { employee, profileId } = this.state.selectedNotification;

    if (this.state.isAcceptingEmployment) {
      // Acepta la invitación
      this.props.onEmployeeCreate({ employeeId: employee.id, profileId });
      this.props.onEmploymentInvitationConfirm(this.state.selectedNotification, true);
    } else {
      // Rechaza la invitación
      this.props.onEmployeeDelete({ employeeId });
      this.props.onEmploymentInvitationConfirm(this.state.selectedNotification, false);
    }

    this.setState({ confirmEmploymentVisible: false });
  };

  onEmploymentInvitationPress = action => {
    this.setState({ confirmEmploymentVisible: true, optionsVisible: false, isAcceptingEmployment: action });
  };

  renderEmploymentInvitationOptions = () => {
    return (
      <View>
        <MenuItem
          title="Aceptar Invitación"
          icon="md-checkmark"
          onPress={() => this.onEmploymentInvitationPress(true)}
        />
        <Divider style={{ backgroundColor: 'grey' }} />
        <MenuItem title="Rechazar Invitación" icon="md-close" onPress={() => this.onEmploymentInvitationPress(false)} />
        <Divider style={{ backgroundColor: 'grey' }} />
      </View>
    );
  };

  renderRow = ({ item }) => {
    return (
      <ListItem
        title={`${item.title}${item.acceptanceDate ? ' (Aceptada)' : item.rejectionDate ? ' (Rechazada)' : ''}`}
        rightTitle={`Hace ${notificationsToFormatString(moment().diff(item.date, 'minutes')).toString()}`}
        rightTitleStyle={{ fontSize: 12 }}
        subtitle={item.body}
        containerStyle={{ backgroundColor: item.read ? 'white' : '#f9e4e7' }}
        subtitleStyle={{ fontSize: 12 }}
        rightIcon={{
          name: 'md-more',
          type: 'ionicon',
          containerStyle: { height: 20, width: 10 },
          onPress: () => this.onOptionsPress(item)
        }}
        onLongPress={() => this.onOptionsPress(item)}
        bottomDivider
      />
    );
  };

  onRefresh = () => {
    return (
      <RefreshControl
        refreshing={this.props.refreshing}
        onRefresh={this.onNotificationsRead}
        colors={[MAIN_COLOR]}
        tintColor={MAIN_COLOR}
      />
    );
  };

  render() {
    if (this.props.loading) return <Spinner />;
    if (this.props.notifications.length)
      return (
        <View style={{ flex: 1 }}>
          <FlatList
            data={this.props.notifications}
            renderItem={this.renderRow.bind(this)}
            keyExtractor={notification => notification.id.toString()}
            extraData={this.props.notifications}
            refreshControl={this.onRefresh()}
          />
          <Menu
            title={`Está seguro que desea ${this.state.isAcceptingEmployment ? 'aceptar' : 'rechazar'} la invitación de empleo? Esta acción no puede ser modificada.`}
            onBackdropPress={() => this.setState({ confirmEmploymentVisible: false })}
            isVisible={(this.state.confirmEmploymentVisible || this.props.employeeSaveLoading) && this.props.navigation.isFocused()}
          >
            <MenuItem
              title="Aceptar"
              icon="md-checkmark"
              onPress={this.onEmploymentConfirmPress}
              loadingWithText={this.props.employeeSaveLoading}
            />
            <Divider style={{ backgroundColor: 'grey' }} />
            <MenuItem
              title="Cancelar"
              icon="md-close"
              onPress={() => this.setState({ confirmEmploymentVisible: false })}
            />
          </Menu>

          <Menu
            title={'Opciones'}
            onBackdropPress={() => this.setState({ optionsVisible: false })}
            isVisible={this.state.optionsVisible}
          >
            {this.state.selectedNotification && this.state.selectedNotification.notificationType.id === NOTIFICATION_TYPES.INVITE &&
              !this.state.selectedNotification.acceptanceDate && !this.state.selectedNotification.rejectionDate
              ? this.renderEmploymentInvitationOptions() : null}
            <Divider style={{ backgroundColor: 'grey' }} />
            <MenuItem title="Eliminar" icon="md-trash" onPress={this.onNotificationDeletePress} />
          </Menu>
        </View>
      );
    return <EmptyList title="No tiene notificaciones" onRefresh={this.onRefresh()} />;
  }
}

const mapStateToProps = state => {
  const { notifications, loading } = state.notificationsList;
  const { profileId } = state.clientData;
  const { commerceId } = state.commerceData;
  const { saveLoading: employeeSaveLoading } = state.employeeData;

  return { notifications, loading, profileId, commerceId, employeeSaveLoading };
};

export default connect(mapStateToProps, {
  onNotificationsRead,
  onNotificationDelete,
  onEmployeeCreate,
  onEmployeeDelete,
  onUserWorkplacesRead,
  onEmploymentInvitationConfirm
})(NotificationsList);
