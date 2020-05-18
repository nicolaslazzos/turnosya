import React, { Component } from 'react';
import { connect } from 'react-redux';
import firebase from 'firebase';
import { Card, Button as RNEButton } from 'react-native-elements';
import { View, StyleSheet, Text, Switch } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  onEmployeeValueChange,
  onEmployeeValuesReset,
  onRolesRead,
  onUserByEmailSearch,
  onEmployeeInvite,
  onEmployeeUpdate
} from '../../actions';
import { CardSection, Input, Picker, Button, IconButton, AreaComponentRenderer } from '../common';
import { MAIN_COLOR, GREY_DISABLED, MAIN_COLOR_DISABLED, ROLES } from '../../constants';

class EmployeeForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      roleError: '',
      editing: props.navigation.getParam('editing') || false
    };
  }

  componentDidMount() {
    this.props.onRolesRead();
  }

  componentWillUnmount() {
    this.props.onEmployeeValuesReset();
  }

  onEmailValueChange = email => {
    this.props.firstName
      ? this.props.onEmployeeValueChange({ firstName: '', lastName: '', phone: '', email })
      : this.props.onEmployeeValueChange({ email: email.trim() });
  };

  onUserDataValidate = () => {
    const {
      commerceId,
      commerceName,
      firstName,
      roleId,
      profileId,
      employeeId,
      visible,
      employees,
      navigation
    } = this.props;

    if (firstName) {
      if (employees.some(employee => employee.profileId === profileId) && !this.state.editing)
        // Si se cargó un usuario y es empleado aca entonces notificar
        this.props.onEmployeeValueChange({ emailError: 'Este usuario ya es empleado de su negocio' });
      // Si se cargó un usuario y no es empleado aca entonces guardarlo
      else if (roleId)
        if (this.state.editing)
          this.props.onEmployeeUpdate({ employeeId, roleId, visible }, navigation);
        else
          this.props.onEmployeeInvite({ commerceId, commerceName, roleId, visible, profileId }, navigation);
    } else {
      this.props.onEmployeeValueChange({ emailError: 'Debe cargar un usuario antes de guardar' });
    }
  };

  onRoleDataValidate = () => {
    const { roleId } = this.props;

    if (roleId && this.state.roleError) this.setState({ roleError: '' });
    else if (!roleId && !this.state.roleError)
      this.setState({ roleError: 'Debe especificar un rol para el empleado' });
  };

  onSavePressHandler = () => {
    this.onUserDataValidate();
    this.onRoleDataValidate();
  };

  onRolesComboFilter = () => {
    return this.props.roles.filter(role => {
      return this.props.roleId === ROLES.OWNER.roleId
        ? ROLES[role.value].value <= this.props.currentRole.value
        : ROLES[role.value].value <= this.props.currentRole.value && role.value !== ROLES.OWNER.roleId;
    });
  };

  render() {
    return (
      <KeyboardAwareScrollView enableOnAndroid extraScrollHeight={20}>
        <View>
          <Card containerStyle={styles.cardStyle}>
            <CardSection
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start'
              }}
            >
              <Input
                label="Email:"
                placeholder="Busque por email..."
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="search"
                onSubmitEditing={() => this.props.onUserByEmailSearch(this.props.email, this.props.commerceId)}
                value={this.props.email}
                errorMessage={this.props.emailError}
                onChangeText={this.onEmailValueChange}
                containerStyle={{ flex: 10 }}
                editable={!this.state.editing} // No se puede modificar la persona, porque se debe enviar invitación y eso
                rightIcon={
                  <RNEButton
                    type="clear"
                    icon={{ name: 'md-search', type: 'ionicon', color: MAIN_COLOR }}
                    loading={this.props.emailLoading}
                    onPress={() => this.props.onUserByEmailSearch(this.props.email, this.props.commerceId)}
                    loadingProps={{ color: MAIN_COLOR }}
                    disabled={this.state.editing}
                  />
                }
              />
            </CardSection>

            <CardSection>
              <Input label="Nombre:" value={this.props.firstName} editable={false} />
            </CardSection>

            <CardSection>
              <Input label="Apellido:" value={this.props.lastName} editable={false} />
            </CardSection>

            <CardSection>
              <Input label="Teléfono:" value={this.props.phone} editable={false} />
            </CardSection>

            <CardSection>
              <Picker
                title={'Rol:'}
                placeholder={{ value: null, label: 'Seleccionar...' }}
                value={this.props.roleId}
                items={this.onRolesComboFilter()}
                onValueChange={roleId => this.props.onEmployeeValueChange({ roleId })}
                errorMessage={this.state.roleError}
                disabled={this.props.email === firebase.auth().currentUser.email}
              />
            </CardSection>

            <AreaComponentRenderer
              hairdressers={
                <CardSection style={styles.employeeVisibleCardSection}>
                  <View style={styles.employeeVisibleText}>
                    <Text>Visible en el perfil:</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Switch
                      onValueChange={visible => this.props.onEmployeeValueChange({ visible })}
                      value={this.props.visible}
                      trackColor={{
                        false: GREY_DISABLED,
                        true: MAIN_COLOR_DISABLED
                      }}
                      thumbColor={this.props.visible ? MAIN_COLOR : 'grey'}
                    />
                  </View>
                </CardSection>
              }
            />

            <CardSection>
              <Button title="Guardar" loading={this.props.saveLoading} onPress={this.onSavePressHandler} />
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
  },
  employeeVisibleCardSection: {
    paddingRight: 12,
    paddingLeft: 16,
    paddingBottom: 5,
    paddingTop: 15,
    flexDirection: 'row'
  },
  employeeVisibleText: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginTop: 2,
    flex: 1
  }
});

const mapStateToProps = state => {
  const { commerceId, name } = state.commerceData;
  const {
    email,
    phone,
    firstName,
    lastName,
    profileId,
    id,
    roleId,
    visible,
    emailLoading,
    emailError,
    saveLoading
  } = state.employeeData;
  const { roles, role: currentRole } = state.roleData;
  const { employees } = state.employeesList;

  return {
    commerceId,
    commerceName: name,
    email,
    phone,
    firstName,
    lastName,
    profileId,
    employeeId: id,
    roleId,
    roles,
    visible,
    currentRole,
    emailLoading,
    emailError,
    saveLoading,
    employees
  };
};

export default connect(mapStateToProps, {
  onEmployeeValueChange,
  onEmployeeValuesReset,
  onRolesRead,
  onUserByEmailSearch,
  onEmployeeInvite,
  onEmployeeUpdate
})(EmployeeForm);
