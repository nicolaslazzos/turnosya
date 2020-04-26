import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Card, CheckBox, Divider } from 'react-native-elements';
import { View, StyleSheet, Switch, Text, Dimensions } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import moment from 'moment';
import {
  onCourtValueChange,
  onCourtAndGroundTypesRead,
  onCourtCreate,
  onCourtUpdate,
  onNextReservationsRead
} from '../../actions';
import { CardSection, Input, Picker, Button, DatePicker, Toast, Menu, MenuItem } from '../common';
import { validateValueType, trimString, cancelReservationNotificationFormat } from '../../utils';
import { MAIN_COLOR, MAIN_COLOR_DISABLED, GREY_DISABLED } from '../../constants';

const pickerWidth = Math.round(Dimensions.get('window').width) / 3.5;

class CourtForm extends PureComponent {
  state = {
    nameError: '',
    courtError: '',
    groundTypeError: '',
    priceError: '',
    lightPriceError: '',
    lightHourError: '',
    disabledFromError: '',
    disabledToError: '',
    lightPriceOpen: false,
    disabledPeriodModal: false,
    confirmationModal: false,
    reservationsToCancel: []
  };

  componentDidMount() {
    this.props.onCourtAndGroundTypesRead();

    if (this.props.lightPrice) this.setState({ lightPriceOpen: true });
    this.isCourtDisabled();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.disabledFrom !== this.props.disabledFrom || prevProps.disabledTo !== this.props.disabledTo) {
      this.renderDisabledDatesError();
    }

    // ver si hay reservas que estén en el periodo de deshabilitación de la cancha
    if (prevProps.nextReservations !== this.props.nextReservations && this.props.navigation.isFocused()) {
      this.disabledPeriodValidate();
    }

    if (prevProps.lightHour !== this.props.lightHour) this.renderLightHourError();
  }

  isCourtDisabled = () => {
    if (this.props.id && this.props.disabledTo > moment()) {
      this.props.onCourtValueChange({ disabled: true });
    }
  };

  onCourtSave = () => {
    const {
      id,
      name,
      description,
      courtTypeId,
      groundTypeId,
      price,
      lightPrice,
      lightHour,
      commerceId,
      navigation,
      disabledFrom,
      disabledTo
    } = this.props;
    const { reservationsToCancel } = this.state;

    if (id) {
      this.props.onCourtUpdate(
        {
          id,
          name,
          description,
          courtTypeId,
          groundTypeId,
          price,
          lightPrice,
          lightHour,
          disabledFrom,
          disabledTo,
          reservationsToCancel
        },
        navigation
      );
    } else {
      this.props.onCourtCreate(
        {
          name,
          description,
          courtTypeId,
          groundTypeId,
          price,
          lightPrice,
          lightHour,
          disabledFrom,
          disabledTo,
          commerceId
        },
        navigation
      );
    }
  };

  renderNameError = () => {
    const name = trimString(this.props.name);

    this.props.onCourtValueChange({ name });

    if (!name) {
      this.setState({ nameError: 'Dato requerido' });
      return false;
    } else {
      this.setState({ nameError: '' });
      return true;
    }
  };

  renderCourtError = () => {
    if (!this.props.courtTypeId) {
      this.setState({ courtError: 'Dato requerido' });
      return false;
    } else {
      this.setState({ courtError: '' });
      return true;
    }
  };

  renderGroundTypeError = () => {
    if (!this.props.groundTypeId) {
      this.setState({ groundTypeError: 'Dato requerido' });
      return false;
    } else {
      this.setState({ groundTypeError: '' });
      return true;
    }
  };

  renderPriceError = () => {
    if (!this.props.price) {
      this.setState({ priceError: 'Dato requerido' });
      return false;
    } else if (!validateValueType('number', this.props.price)) {
      this.setState({ priceError: 'Debe ingresar un valor numérico' });
      return false;
    } else {
      this.setState({ priceError: '' });
      return true;
    }
  };

  renderLightPriceError = () => {
    if (this.state.lightPriceOpen) {
      if (!this.props.lightPrice) {
        this.setState({ lightPriceError: 'Dato requerido' });
        return false;
      } else if (!validateValueType('number', this.props.lightPrice)) {
        this.setState({ lightPriceError: 'Debe ingresar un valor numérico' });
        return false;
      }
    }

    this.setState({ lightPriceError: '' });
    return true;
  };

  renderLightHourError = () => {
    if (this.state.lightPriceOpen && !this.props.lightHour) {
      this.setState({ lightHourError: 'Dato requerido' });
      return false;
    }

    this.setState({ lightHourError: '' });
    return true;
  };

  validateMinimumData = () => {
    return (
      this.renderNameError() &&
      this.renderCourtError() &&
      this.renderGroundTypeError() &&
      this.renderPriceError() &&
      this.renderLightPriceError() &&
      this.renderLightHourError() &&
      this.renderDisabledDatesError()
    );
  };

  onCourtTypeChangeHandle = (courtTypeId, index) => {
    this.setState({ courtError: '' });

    if (index) {
      this.props.onCourtValueChange({ courtTypeId });
    } else {
      this.props.onCourtValueChange({ courtTypeId: '' });
    }
  };

  onGroundTypeChangeHandle = (groundTypeId, index) => {
    this.setState({ groundTypeError: '' });

    if (index && this.props.grounds.length) {
      this.props.onCourtValueChange({ groundTypeId });
    } else {
      this.props.onCourtValueChange({ groundTypeId: '' });
    }
  };

  onCheckBoxPress = () => {
    if (this.state.lightPriceOpen) {
      this.props.onCourtValueChange({ lightPrice: '', lightHour: '' });
    }
    this.setState({ lightPriceOpen: !this.state.lightPriceOpen });
  };

  renderLightPriceInput() {
    if (this.state.lightPriceOpen) {
      return (
        <CardSection
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-around'
          }}
        >
          <View style={{ flex: 3 }}>
            <Input
              label="Precio por turno (con luz):"
              placeholder="Precio de la cancha"
              keyboardType="numeric"
              value={this.props.lightPrice && this.props.lightPrice.toString()}
              errorMessage={this.state.lightPriceError}
              onChangeText={lightPrice => this.props.onCourtValueChange({ lightPrice: lightPrice.trim() })}
              onFocus={() => this.setState({ lightPriceError: '' })}
              onBlur={this.renderLightPriceError}
            />
          </View>
          <View style={{ flex: 2, alignItems: 'flex-end', paddingRight: 10 }}>
            <DatePicker
              date={this.props.lightHour}
              label="Hora:"
              placeholder="Prenden luces"
              onDateChange={lightHour => this.props.onCourtValueChange({ lightHour })}
              errorMessage={this.state.lightHourError}
              pickerWidth={pickerWidth}
            />
          </View>
        </CardSection>
      );
    }
  }

  renderDisableCourtForm = () => {
    if (this.props.disabled) {
      return (
        <View>
          <CardSection
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-around',
              paddingBottom: 10
            }}
          >
            <DatePicker
              date={this.props.disabledFrom}
              mode="datetime"
              label="Desde:"
              placeholder="Fecha desde"
              errorMessage={this.state.disabledFromError}
              onDateChange={this.onDisabledFromValueChange}
            />
            <DatePicker
              date={this.props.disabledTo}
              mode="datetime"
              label="Hasta:"
              placeholder="Opcional"
              errorMessage={this.state.disabledToError}
              onDateChange={this.onDisabledToValueChange}
            />
          </CardSection>
          {this.props.disabledTo && (
            <CardSection>
              <CheckBox
                title="Agregar fecha de fin de hasta"
                iconType="material"
                checkedIcon="clear"
                uncheckedIcon="add"
                checkedColor={MAIN_COLOR}
                uncheckedColor={MAIN_COLOR}
                checkedTitle="Quitar fecha de hasta"
                checked={!!this.props.disabledTo}
                onPress={() => this.props.onCourtValueChange({ disabledTo: null })}
              />
            </CardSection>
          )}
        </View>
      );
    }
  };

  onDisableSwitch = disabled => {
    this.props.onCourtValueChange({ disabled });

    if (!disabled) {
      this.props.onCourtValueChange({ disabledFrom: null, disabledTo: null });
    }
  };

  onDisabledFromValueChange = date => {
    date = moment(date);

    if (moment().diff(date, 'seconds') > 30) {
      return Toast.show({
        text: 'No puede ingresar una fecha anterior a la actual'
      });
    }

    this.props.onCourtValueChange({ disabledFrom: date });
  };

  onDisabledToValueChange = date => {
    this.props.onCourtValueChange({ disabledTo: moment(date) });
  };

  renderDisabledDatesError = () => {
    if (this.props.disabled) {
      if (!this.props.disabledFrom) {
        this.setState({ disabledFromError: 'Dato requerido' });
        return false;
      } else if (this.props.disabledTo && this.props.disabledFrom >= this.props.disabledTo) {
        this.setState({
          disabledFromError: 'Debe ser anterior a la fecha de deshabilitación',
          disabledToError: 'Debe ser posterior a la fecha de habilitación'
        });
        return false;
      }
    }

    this.setState({ disabledFromError: '', disabledToError: '' });
    return true;
  };

  onSavePress = () => {
    this.setState({ reservationsToCancel: [] });

    if (this.validateMinimumData()) {
      if (false && this.props.disabled && this.props.id) {
        this.props.onNextReservationsRead({
          commerceId: this.props.commerceId,
          courtId: this.props.id,
          startDate: this.props.disabledFrom,
          endDate: this.props.disabledTo
        });
      } else {
        this.onCourtSave();
      }
    }
  };

  disabledPeriodValidate = () => {
    if (this.props.nextReservations.length) {
      this.setState({ disabledPeriodModal: true });
    } else {
      this.onCourtSave();
    }
  };

  onSaveAndCancelReservations = () => {
    const reservationsToCancel = this.props.nextReservations.map(res => {
      return {
        ...res,
        notification: cancelReservationNotificationFormat({
          startDate: res.startDate,
          actorName: this.props.commerceName,
          cancellationReason: 'Deshabilitación de la cancha'
        })
      };
    });

    this.setState(
      {
        reservationsToCancel,
        confirmationModal: false
      },
      this.onCourtSave
    );
  };

  renderDisabledPeriodModal = () => {
    const { nextReservations } = this.props;

    if (nextReservations.length) {
      const firstReservationDate = nextReservations[0].startDate;
      const lastReservationDate = nextReservations[nextReservations.length - 1].endDate;

      return (
        <Menu
          title={
            'Tienes ' +
            nextReservations.length.toString() +
            ' reservas de esta cancha' +
            ' entre el ' +
            firstReservationDate.format('DD/MM/YYYY') +
            ' a las ' +
            firstReservationDate.format('HH:mm') +
            ' hs.' +
            ' y el ' +
            lastReservationDate.format('DD/MM/YYYY') +
            ' a las ' +
            lastReservationDate.format('HH:mm') +
            ' hs.' +
            ' Seleccione "Cancelar reservas y notificar" para cancelar dichas ' +
            'reservas y deshabilitar la cancha o "Volver" para cambiar el periodo ' +
            'de deshabilitación.'
          }
          onBackdropPress={() => this.setState({ disabledPeriodModal: false })}
          isVisible={this.state.disabledPeriodModal}
        >
          <MenuItem
            title="Cancelar reservas y notificar"
            icon="md-trash"
            onPress={() =>
              this.setState({
                confirmationModal: true,
                disabledPeriodModal: false
              })
            }
          />
          <Divider style={{ backgroundColor: 'grey' }} />
          <MenuItem title="Volver" icon="md-close" onPress={() => this.setState({ disabledPeriodModal: false })} />
        </Menu>
      );
    }
  };

  render() {
    return (
      <KeyboardAwareScrollView enableOnAndroid extraScrollHeight={20}>
        <Card containerStyle={styles.cardStyle}>
          <CardSection>
            <Input
              label="Nombre:"
              placeholder="Cancha 1"
              value={this.props.name}
              errorMessage={this.state.nameError || this.props.existsError}
              onChangeText={name => {
                this.props.onCourtValueChange({ name });
                this.props.onCourtValueChange({ existsError: '' });
              }}
              onFocus={() => this.setState({ nameError: '' })}
              onBlur={this.renderNameError}
            />
          </CardSection>

          <CardSection>
            <Input
              label="Descripción:"
              placeholder="Descripción de la cancha"
              multiline={true}
              maxLength={250}
              maxHeight={180}
              onChangeText={description => this.props.onCourtValueChange({ description: description })}
              onBlur={() => this.props.onCourtValueChange({ description: trimString(this.props.description) })}
              value={this.props.description}
            />
          </CardSection>

          <CardSection>
            <Picker
              title={'Tipo de cancha:'}
              placeholder={{ value: null, label: 'Seleccionar...' }}
              value={this.props.courtTypeId}
              items={this.props.courts}
              onValueChange={this.onCourtTypeChangeHandle}
              errorMessage={this.state.courtError}
            />
          </CardSection>

          <CardSection>
            <Picker
              title={'Tipo de suelo:'}
              placeholder={{ value: null, label: 'Seleccionar...' }}
              value={this.props.groundTypeId}
              items={this.props.grounds}
              onValueChange={this.onGroundTypeChangeHandle}
              disabled={!this.props.grounds.length}
              errorMessage={this.state.groundTypeError}
            />
          </CardSection>

          <CardSection>
            <Input
              label="Precio por turno (sin luz):"
              placeholder="Precio de la cancha"
              keyboardType="numeric"
              value={this.props.price.toString()}
              errorMessage={this.state.priceError}
              onChangeText={price => this.props.onCourtValueChange({ price: price.trim() })}
              onFocus={() => this.setState({ priceError: '' })}
              onBlur={this.renderPriceError}
            />
          </CardSection>

          {this.renderLightPriceInput()}

          <CardSection>
            <CheckBox
              title="Agregar precio con luz"
              iconType="material"
              checkedIcon="clear"
              uncheckedIcon="add"
              uncheckedColor={MAIN_COLOR}
              checkedColor={MAIN_COLOR}
              checkedTitle="Borrar precio con luz"
              checked={this.state.lightPriceOpen}
              onPress={this.onCheckBoxPress}
            />
          </CardSection>

          <Divider style={{ margin: 12 }} />

          <CardSection style={styles.disableCourtCardSection}>
            <View style={styles.disableCourtText}>
              <Text>Deshabilitar cancha:</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Switch
                onValueChange={this.onDisableSwitch}
                value={this.props.disabled}
                trackColor={{
                  false: GREY_DISABLED,
                  true: MAIN_COLOR_DISABLED
                }}
                thumbColor={this.props.disabled ? MAIN_COLOR : 'grey'}
              />
            </View>
          </CardSection>
          {this.renderDisableCourtForm()}
          <CardSection>
            <Button
              title="Guardar"
              loading={this.props.loading || this.props.loadingReservations}
              onPress={this.onSavePress}
            />
          </CardSection>
        </Card>

        {this.renderDisabledPeriodModal()}
        <Menu
          title="¿Está serguro que desea cancelar las reservas y guardar?"
          onBackdropPress={() => this.setState({ confirmationModal: false })}
          isVisible={this.state.confirmationModal}
        >
          <MenuItem title="Aceptar" icon="md-checkmark" onPress={this.onSaveAndCancelReservations} />
          <Divider style={{ backgroundColor: 'grey' }} />
          <MenuItem title="Cancelar" icon="md-close" onPress={() => this.setState({ confirmationModal: false })} />
        </Menu>
      </KeyboardAwareScrollView>
    );
  }
}

const styles = StyleSheet.create({
  cardStyle: {
    padding: 5,
    paddingTop: 10,
    borderRadius: 10,
    marginBottom: 20
  },
  disableCourtCardSection: {
    paddingRight: 12,
    paddingLeft: 15,
    paddingVertical: 5,
    flexDirection: 'row'
  },
  disableCourtText: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flex: 1
  }
});

const mapStateToProps = state => {
  const {
    id,
    name,
    description,
    courts,
    courtTypeId,
    grounds,
    groundTypeId,
    price,
    lightPrice,
    lightHour,
    loading,
    existsError,
    disabled,
    disabledFrom,
    disabledTo
  } = state.courtForm;
  const { commerceId, name: commerceName } = state.commerceData;
  const { nextReservations } = state.reservationsList;
  const loadingReservations = state.reservationsList.loading;

  return {
    id,
    name,
    description,
    courts,
    courtTypeId,
    grounds,
    groundTypeId,
    price,
    lightPrice,
    lightHour,
    loading,
    existsError,
    disabled,
    commerceId,
    commerceName,
    disabledFrom,
    disabledTo,
    nextReservations,
    loadingReservations
  };
};

export default connect(mapStateToProps, {
  onCourtValueChange,
  onCourtAndGroundTypesRead,
  onCourtCreate,
  onCourtUpdate,
  onNextReservationsRead
})(CourtForm);
