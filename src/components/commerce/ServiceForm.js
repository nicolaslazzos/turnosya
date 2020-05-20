import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Card } from 'react-native-elements';
import { View, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { CardSection, Button, Input } from '../common';
import { validateValueType, trimString } from '../../utils';
import { onServiceValueChange, onServiceCreate, onServiceUpdate } from '../../actions';

class ServiceForm extends Component {
  state = { nameError: '', durationError: '', priceError: '' };

  componentDidMount() {
    const { params } = this.props.navigation.state;

    if (params) this.props.onServiceValueChange(params.service);
  }

  onSaveButtonPress() {
    if (this.validateMinimumData()) {
      const { name, duration, price, description, navigation, commerceId, employeeId, employeesIds } = this.props;
      const { params } = this.props.navigation.state;

      if (params) {
        const { id } = this.props.navigation.state.params.service;

        this.props.onServiceUpdate(
          {
            id,
            employeesIds,
            name,
            duration,
            price,
            description,
          },
          navigation
        );
      } else {
        this.props.onServiceCreate(
          {
            commerceId,
            employeesIds: [employeeId],
            name,
            duration,
            price,
            description,
          },
          navigation
        );
      }
    }
  }

  renderNameError = () => {
    const name = trimString(this.props.name);

    this.props.onServiceValueChange({ name });
    if (!name) {
      this.setState({ nameError: 'Dato requerido' });
      return false;
    } else {
      this.setState({ nameError: '' });
      return true;
    }
  };

  renderDurationError = () => {
    if (!this.props.duration) {
      this.setState({ durationError: 'Dato requerido' });
      return false;
    } else if (!validateValueType('int', this.props.duration)) {
      this.setState({ durationError: 'Debe ingresar un valor numérico' });
      return false;
    } else {
      this.setState({ durationError: '' });
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

  validateMinimumData = () => {
    return this.renderNameError() && this.renderDurationError() && this.renderPriceError();
  };

  render() {
    const { cardStyle } = styles;

    return (
      <KeyboardAwareScrollView enableOnAndroid extraScrollHeight={60}>
        <View>
          <Card containerStyle={cardStyle}>
            <CardSection>
              <Input
                label="Nombre:"
                placeholder="Nombre del servicio"
                value={this.props.name}
                errorMessage={this.state.nameError || this.props.existsError}
                onChangeText={name => this.props.onServiceValueChange({ name })}
                onFocus={() => {
                  this.setState({ nameError: '' });
                  this.props.onServiceValueChange({ existsError: '' });
                }}
                onBlur={this.renderNameError}
              />
            </CardSection>
            <CardSection>
              <Input
                label="Duración (minutos):"
                placeholder="Duración del servicio"
                keyboardType="numeric"
                value={this.props.duration}
                errorMessage={this.state.durationError}
                onChangeText={duration => this.props.onServiceValueChange({ duration: duration.trim() })}
                onFocus={() => this.setState({ durationError: '' })}
                onBlur={this.renderDurationError}
              />
            </CardSection>
            <CardSection>
              <Input
                label="Precio:"
                placeholder="Precio del servicio"
                keyboardType="numeric"
                value={this.props.price}
                errorMessage={this.state.priceError}
                onChangeText={price => this.props.onServiceValueChange({ price: price.trim() })}
                onFocus={() => this.setState({ priceError: '' })}
                onBlur={this.renderPriceError}
              />
            </CardSection>
            <CardSection>
              <Input
                label="Descripción:"
                placeholder="Descripción del servicio"
                multiline={true}
                maxLength={250}
                maxHeight={180}
                onChangeText={description => this.props.onServiceValueChange({ description })}
                onBlur={() => this.props.onServiceValueChange({ description: trimString(this.props.description) })}
                value={this.props.description}
              />
            </CardSection>
            <CardSection>
              <Button title="Guardar" loading={this.props.loading} onPress={this.onSaveButtonPress.bind(this)} />
            </CardSection>
          </Card>
        </View>
      </KeyboardAwareScrollView>
    );
  }
}

const styles = StyleSheet.create({
  cardStyle: {
    padding: 5,
    paddingTop: 10,
    borderRadius: 10
  }
});

const mapStateToProps = state => {
  const { name, duration, price, description, error, loading, employeesIds, existsError } = state.serviceForm;
  const { commerceId } = state.commerceData;
  const { employeeId } = state.roleData;

  return { name, duration, price, description, error, loading, commerceId, employeeId, employeesIds, existsError };
};

export default connect(mapStateToProps, {
  onServiceValueChange,
  onServiceCreate,
  onServiceUpdate
})(ServiceForm);
