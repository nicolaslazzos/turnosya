import React, { Component } from 'react';
import { View, FlatList, Text, RefreshControl, ScrollView } from 'react-native';
import { Calendar } from './Calendar';
import { Spinner } from './Spinner';
import { ListItem } from 'react-native-elements';
import moment from 'moment';
import { getHourAndMinutes } from '../../utils';
import { MAIN_COLOR } from '../../constants';

/*
    props: {
        cards: objects array,
        selectedDate: date,
        onDateChanged: function,
        reservationMinLength: int,
        reservationDayPeriod: int,'
        loading: bool,
        onRefresh: function
    }
*/

class Schedule extends Component {
    state = { slots: [] };

    componentDidUpdate(prevProps) {
        if (prevProps.cards !== this.props.cards || (prevProps.loading && !this.props.loading)) {
            this.onDateSelected(this.props.selectedDate);
        }
    }

    onDateSelected = async selectedDate => {
        await this.props.onDateChanged(selectedDate);

        // dia de la semana (0-6)
        var dayId = selectedDate.day();

        //slots & shifts
        var slots = [];
        const { cards } = this.props;
        var dayShifts = cards.find(card => card.days.includes(dayId)); // horario de atencion ese dia de la semana

        //si hay horario de atencion ese dia, genera los slots
        if (dayShifts) {
            var {
                firstShiftStart,
                firstShiftEnd,
                secondShiftStart,
                secondShiftEnd
            } = dayShifts;

            slots = this.generateSlots(
                selectedDate,
                firstShiftStart,
                firstShiftEnd,
                slots
            );

            if (secondShiftStart && secondShiftEnd) {
                slots = this.generateSlots(
                    selectedDate,
                    secondShiftStart,
                    secondShiftEnd,
                    slots
                );
            }
        }

        this.setState({ slots });
    };

    generateSlots = (selectedDate, shiftStart, shiftEnd, slots) => {
        //selected date params
        var year = selectedDate.year();
        var month = selectedDate.month();
        var date = selectedDate.date(); // dia del mes

        var slotId = slots.length;
        shiftStart = getHourAndMinutes(shiftStart);
        shiftEnd = getHourAndMinutes(shiftEnd);
        const { reservationMinLength } = this.props;

        var shiftStartDate = moment.utc([
            year,
            month,
            date,
            shiftStart.hour,
            shiftStart.minutes
        ]);
        var shiftEndDate = moment.utc([
            year,
            month,
            date,
            shiftEnd.hour,
            shiftEnd.minutes
        ]);
        var slotStartDate = moment.utc(shiftStart);

        for (
            var j = 0;
            shiftStartDate.add(reservationMinLength, 'minutes') <= shiftEndDate;
            j++
        ) {
            slots.push({
                id: slotId,
                startHour: moment.utc(slotStartDate),
                endHour: moment(shiftStartDate),
                available: true
            });
            slotStartDate.add(reservationMinLength, 'minutes');
            slotId++;
        }

        return slots;
    };

    renderList = ({ item }) => {
        return (
            <ListItem
                leftIcon={{
                    name: 'md-time',
                    type: 'ionicon',
                    color: item.available ? 'black' : 'grey'
                }}
                rightIcon={
                    item.available
                        ? { name: 'ios-arrow-forward', type: 'ionicon', color: 'black' }
                        : null
                }
                title={`${item.startHour.format('HH:mm')}`}
                containerStyle={{
                    backgroundColor: item.available ? 'white' : '#E7E7E7'
                }}
                titleStyle={{ color: item.available ? 'black' : 'grey' }}
                rightSubtitleStyle={{ color: 'grey' }}
                rightSubtitle={item.available ? null : 'Ocupado'}
                bottomDivider
            />
        );
    };

    onRefresh = () => {
        return (
            <RefreshControl
                refreshing={this.props.loading}
                onRefresh={() => this.props.onRefresh()}
                colors={[MAIN_COLOR]}
                tintColor={MAIN_COLOR}
            />
        );
    }

    renderSlots = () => {
        if (this.state.slots.length) {
            return (
                <FlatList
                    data={this.state.slots}
                    renderItem={this.renderList.bind(this)}
                    keyExtractor={slot => slot.id.toString()}
                    refreshControl={this.onRefresh()}
                />
            );
        } else {
            return (
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, alignSelf: 'stretch', justifyContent: 'center' }}
                    refreshControl={this.onRefresh()}
                >
                    <Text style={{ textAlign: 'center', margin: 15 }}>
                        No hay turnos para este dia...
                    </Text>
                </ScrollView>
            );
        }
    };

    render() {
        return (
            <View style={{ alignSelf: 'stretch', flex: 1 }}>
                <Calendar
                    onDateSelected={date => this.onDateSelected(date)}
                    startingDate={this.props.selectedDate}
                    maxDate={moment().add(this.props.reservationDayPeriod, 'days')}
                    datesWhitelist={[
                        {
                            start: moment(),
                            end: moment().add(this.props.reservationDayPeriod, 'days')
                        }
                    ]}
                />

                {
                    this.props.loading
                        ? <Spinner style={{ position: 'relative' }} />
                        : this.renderSlots()
                }
            </View>
        );
    }
}

export { Schedule };