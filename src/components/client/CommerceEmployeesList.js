import React, { Component } from 'react';
import { FlatList } from 'react-native';
import { ListItem } from 'react-native-elements';
import { connect } from 'react-redux';
import { EmptyList, Spinner } from '../common';
import { onReservationValueChange, onEmployeesRead } from '../../actions';

class CommerceEmployeesList extends Component {
  componentDidMount() {
    this.unsubscribeEmployeesRead = this.props.onEmployeesRead({
      commerceId: this.props.commerce.commerceId,
      visible: true,
      startDate: true,
      employeesIds: this.props.service ? this.props.service.employeesIds : null
    });
  }

  componentWillUnmount() {
    this.unsubscribeEmployeesRead && this.unsubscribeEmployeesRead();
  }

  onEmployeePress = employee => {
    this.props.onReservationValueChange({ employee });

    if (this.props.navigation.getParam('navigatedFromProfile')) {
      this.props.navigation.navigate('commerceServicesList');
    } else {
      this.props.navigation.navigate('commerceServicesSchedule');
    }
  };

  renderItem = ({ item }) => {
    return (
      <ListItem
        leftAvatar={{
          source: item.profilePicture ? { uri: item.profilePicture } : null,
          icon: { name: 'person', type: 'material' },
          size: 'medium'
        }}
        title={`${item.firstName} ${item.lastName}`}
        rightIcon={{
          name: 'ios-arrow-forward',
          type: 'ionicon',
          color: 'black'
        }}
        bottomDivider
        onPress={() => this.onEmployeePress(item)}
      />
    );
  };

  render() {
    if (this.props.loading) return <Spinner />;

    if (this.props.employees.length) {
      return (
        <FlatList
          data={this.props.employees}
          renderItem={this.renderItem}
          keyExtractor={employee => employee.id}
          contentContainerStyle={{ paddingBottom: 15 }}
        />
      );
    }

    return <EmptyList title="Parece que no hay estilistas" />;
  }
}

const mapStateToProps = state => {
  const { commerce, service } = state.reservation;
  const { employees, loading } = state.employeesList;

  return { commerce, service, employees, loading };
};

export default connect(mapStateToProps, {
  onReservationValueChange,
  onEmployeesRead
})(CommerceEmployeesList);
