import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StackActions, NavigationActions } from 'react-navigation';
import { Input, Button, CardSection } from '../common';
import ServiceReservationDetails from '../ServiceReservationDetails';
import { onReservationValueChange, onCommerceServiceReservationCreate } from '../../actions';
import { validateValueType } from '../../utils';

class CommerceCourtReservationRegister extends Component {
    state = { nameError: '', phoneError: '' };

    componentDidUpdate(prevProps) {
        if (this.props.saved && !prevProps.saved) {
            const navigationAction = StackActions.reset({
                index: 1,
                actions: [
                    NavigationActions.navigate({ routeName: 'servicesCalendar' }),
                    NavigationActions.navigate({ routeName: 'serviceReservationRegister' })
                ],
            });

            this.props.navigation.dispatch(navigationAction);
        }
    }

    renderInputs = () => {
        if (!this.props.saved) {
            return (
                <View>
                    <CardSection style={styles.cardSection}>
                        <Input
                            label="Nombre:"
                            placeholder='Nombre del cliente'
                            autoCapitalize='words'
                            value={this.props.clientName}
                            onChangeText={this.onNameValueChange}
                            errorMessage={this.state.nameError}
                            onFocus={() => this.setState({ nameError: '' })}
                            onBlur={this.nameError}
                        />
                    </CardSection>
                    <CardSection style={styles.cardSection}>
                        <Input
                            label="Teléfono:"
                            placeholder='Teléfono del cliente (opcional)'
                            value={this.props.clientPhone}
                            onChangeText={this.onPhoneValueChange}
                            errorMessage={this.state.phoneError}
                            onFocus={() => this.setState({ phoneError: '' })}
                            onBlur={this.phoneError}
                        />
                    </CardSection>
                </View>
            );
        }
    };

    onNameValueChange = name => {
        this.props.onReservationValueChange({
            prop: 'clientName',
            value: name
        });
    }

    onPhoneValueChange = phone => {
        this.props.onReservationValueChange({
            prop: 'clientPhone',
            value: phone
        });
    }

    nameError = () => {
        const { clientName } = this.props;

        if (!clientName) {
            this.setState({ nameError: 'Dato requerido' });
        } else if (!validateValueType('name', clientName)) {
            this.setState({ nameError: 'Formato no valido' });
        } else {
            this.setState({ nameError: '' });
            return false;
        }

        return true;
    }

    phoneError = () => {
        const { clientPhone } = this.props;

        if (clientPhone && !validateValueType('phone', clientPhone)) {
            this.setState({ phoneError: 'Formato no valido' });
            return true;
        } else {
            this.setState({ phoneError: '' });
            return false;
        }
    }

    renderButtons = () => {
        if (!this.props.saved) {
            return (
                <CardSection>
                    <Button
                        title="Confirmar Reserva"
                        loading={this.props.loading}
                        onPress={this.onConfirmReservation}
                    />
                </CardSection>
            );
        }
    }

    onConfirmReservation = () => {
        if (!this.nameError() && !this.phoneError()) {
            const { commerceId, areaId, clientName, clientPhone, employeeId, service, startDate, endDate, price } = this.props;

            this.props.onCommerceServiceReservationCreate({
                commerceId,
                areaId,
                serviceId: service.id,
                employeeId,
                clientName,
                clientPhone,
                startDate,
                endDate,
                price
            })
        }
    }

    render() {
        const { clientName, clientPhone, service, startDate, endDate, price, saved } = this.props;

        return (
            <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={60}
                contentContainerStyle={{ flexGrow: 1 }}
            >
                <ServiceReservationDetails
                    name={saved && clientName}
                    info={saved && clientPhone}
                    infoIcon='ios-call'
                    service={service}
                    startDate={startDate}
                    endDate={endDate}
                    price={price}
                />
                {this.renderInputs()}
                <View style={styles.confirmButtonContainer}>
                    {this.renderButtons()}
                </View>
            </KeyboardAwareScrollView>
        );
    }
}

const styles = StyleSheet.create({
    cardSection: {
        paddingHorizontal: 10
    },
    confirmButtonContainer: {
        flex: 1,
        justifyContent: "flex-end",
        alignSelf: "stretch"
    }
});

const mapStateToProps = state => {
    const { commerceId, area: { areaId } } = state.commerceData;
    const { clientName, clientPhone, service, startDate, endDate, price, saved, loading } = state.reservation;
    const { employeeId } = state.roleData;

    return { commerceId, areaId, clientName, clientPhone, service, employeeId, startDate, endDate, price, saved, loading };
}

export default connect(mapStateToProps, {
    onReservationValueChange,
    onCommerceServiceReservationCreate
})(CommerceCourtReservationRegister);