import React, { Component } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { ListItem, ButtonGroup } from 'react-native-elements';
import moment from 'moment';
import { connect } from 'react-redux';
import { Calendar, Spinner, EmptyList, AreaComponentRenderer, PermissionsAssigner, Badge } from '../common';
import { onCommerceDetailedReservationsRead } from '../../actions';
import { MAIN_COLOR, AREAS, ROLES, SUCCESS_COLOR } from '../../constants';
import EmployeesFilter from './EmployeesFilter';

class CommerceReservationsList extends Component {
  state = {
    selectedDate: moment(),
    selectedIndex: 1,
    selectedReservation: {},
    detailsVisible: false,
    selectedEmployeeId: this.props.selectedEmployeeId
  };

  componentDidMount() {
    this.onDateSelected(moment());

    this.willFocusSubscription = this.props.navigation.addListener('willFocus', () =>
      this.onEmployeesFilterValueChange(this.props.selectedEmployeeId)
    );
  }

  componentWillUnmount() {
    this.willFocusSubscription.remove && this.willFocusSubscription.remove();
  }

  onDateSelected = date => {
    const selectedDate = moment([date.year(), date.month(), date.date()]);

    this.props.onCommerceDetailedReservationsRead({
      commerceId: this.props.commerceId,
      startDate: selectedDate,
      endDate: moment(selectedDate).add(1, 'days'),
      employeeId: this.state.selectedEmployeeId
    });

    this.setState({ selectedDate });
  };

  filterLists = () => {
    const pastList = [];
    const currentList = [];
    const nextList = [];

    this.props.reservations.forEach(res => {
      if (res.endDate < moment()) {
        pastList.unshift(res);
      } else if (res.startDate <= moment() && res.endDate >= moment()) {
        currentList.push(res);
      } else {
        nextList.push(res);
      }
    });

    return [pastList, currentList, nextList];
  }

  onEmployeesFilterValueChange = selectedEmployeeId => {
    if (selectedEmployeeId && selectedEmployeeId !== this.state.selectedEmployeeId) {
      this.setState({ selectedEmployeeId }, () => this.onDateSelected(this.state.selectedDate));
    }
  };

  renderItem = ({ item }) => {
    const clientName = item.client ? `${item.client.firstName} ${item.client.lastName}` : item.clientName;
    const serviceName = item.court ? item.court.name : item.service.name;

    return (
      <ListItem
        rightIcon={{
          name: 'ios-arrow-forward',
          type: 'ionicon',
          color: 'black'
        }}
        title={`${item.startDate.format('HH:mm')} a ${item.endDate.format('HH:mm')}`}
        subtitle={`${clientName}\n${serviceName}`}
        rightTitle={`$${item.price}`}
        rightTitleStyle={styles.listItemRightTitleStyle}
        rightSubtitle={
          <View style={{ alignItems: 'flex-end' }}>
            <AreaComponentRenderer
              sports={
                <Text style={styles.listItemRightSubtitleStyle}>
                  {item.court && item.court.lightHour && item.court.lightHour <= item.startDate.format('HH:mm') ? 'Con Luz' : 'Sin Luz'}
                </Text>
              }
            />
            {item.payment ? <Badge value='Pagado' color={SUCCESS_COLOR} /> : null}
          </View>
        }
        onPress={() => this.props.navigation.navigate('reservationDetails', { reservation: item })}
        bottomDivider
      />
    );
  };

  getButton = ({ title, listLength, listIndex }) => {
    const isSelected = listIndex === this.state.selectedIndex;

    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center'
      }}
      >
        <Text style={{
          color: isSelected ? MAIN_COLOR : 'white',
          paddingRight: 6,
          fontSize: 12,
          textAlignVertical: 'center'
        }}
        >
          {title}
        </Text>
        <Badge
          value={listLength}
          color={isSelected ? MAIN_COLOR : 'white'}
          textStyle={{ color: isSelected ? 'white' : MAIN_COLOR, fontSize: 12 }}
          containerStyle={{ paddingTop: 0 }}
          badgeStyle={{ paddingLeft: 3, paddingRight: 3, height: 21, borderRadius: 10.5 }}
        />
      </View>
    )
  }

  render() {
    const filteredLists = this.filterLists();

    const buttons = [
      { element: () => this.getButton({ title: 'PASADOS', listLength: filteredLists[0].length, listIndex: 0 }) },
      { element: () => this.getButton({ title: 'EN CURSO', listLength: filteredLists[1].length, listIndex: 1 }) },
      { element: () => this.getButton({ title: 'PRÓXIMOS', listLength: filteredLists[2].length, listIndex: 2 }) }
    ];

    return (
      <View style={{ alignSelf: 'stretch', flex: 1 }}>
        <AreaComponentRenderer
          hairdressers={
            <PermissionsAssigner requiredRole={ROLES.ADMIN}>
              <EmployeesFilter onValueChange={this.onEmployeesFilterValueChange} />
            </PermissionsAssigner>
          }
        />

        <Calendar onDateSelected={date => this.onDateSelected(date)} startingDate={this.state.selectedDate} />

        <ButtonGroup
          onPress={selectedIndex => this.setState({ selectedIndex })}
          selectedIndex={this.state.selectedIndex}
          buttons={buttons}
          containerBorderRadius={0}
          containerStyle={styles.buttonGroupContainerStyle}
          selectedButtonStyle={styles.buttonGroupSelectedButtonStyle}
          buttonStyle={styles.buttonGroupButtonStyle}
          textStyle={styles.buttonGroupTextStyle}
          selectedTextStyle={styles.buttonGroupSelectedTextStyle}
          innerBorderStyle={styles.buttonGroupInnerBorderStyle}
        />

        {
          this.props.loading ? <Spinner style={{ position: 'relative' }} />
            : filteredLists[this.state.selectedIndex].length ?
              <FlatList
                data={filteredLists[this.state.selectedIndex]}
                renderItem={this.renderItem.bind(this)}
                keyExtractor={reservation => reservation.id.toString()}
              />
              : <EmptyList title="No hay turnos" />
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  buttonGroupContainerStyle: {
    height: 45,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 0.5,
    marginBottom: 0,
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0
  },
  buttonGroupSelectedButtonStyle: {
    backgroundColor: 'white'
  },
  buttonGroupButtonStyle: {
    backgroundColor: MAIN_COLOR
  },
  buttonGroupTextStyle: {
    color: 'white'
  },
  buttonGroupSelectedTextStyle: {
    color: MAIN_COLOR
  },
  buttonGroupInnerBorderStyle: {
    width: 0
  },
  listItemRightTitleStyle: {
    fontWeight: 'bold',
    color: 'black',
    marginRight: 2
  },
  listItemRightSubtitleStyle: {
    color: 'grey',
    fontSize: 12,
    marginRight: 2
  }
});

const mapStateToProps = state => {
  const {
    commerceId,
    area: { areaId }
  } = state.commerceData;
  const { detailedReservations, loading } = state.reservationsList;
  const { services } = state.servicesList;
  const { courts } = state.courtsList;
  const selectedEmployeeId = areaId === AREAS.hairdressers ? state.employeesList.selectedEmployeeId : null;

  return { commerceId, areaId, selectedEmployeeId, reservations: detailedReservations, services, courts, loading };
};

export default connect(mapStateToProps, {
  onCommerceDetailedReservationsRead
})(CommerceReservationsList);
