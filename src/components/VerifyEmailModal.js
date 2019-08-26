import React from 'react';
import { connect } from 'react-redux';
import { sendEmailVefification } from '../actions';
import { Menu, MenuItem } from '../components/common';

class VerifyEmailModal extends React.Component {
  componentWillMount() {
    this.setState({ isVisible: true });
  }

  onBackdropPress = () => {
    this.setState({ isVisible: false });
    this.props.onModalCloseCallback();
  };

  onSendEmailPress = () => {
    this.props.sendEmailVefification();
    this.props.onModalCloseCallback();
  };

  render() {
    return (
      <Menu
        title="Lo sentimos, para reservar y crear un negocio, deberá verificar su email primero:"
        onBackdropPress={() => this.onBackdropPress()}
        isVisible={this.state.isVisible}
      >
        <MenuItem
          title="Quiero que me reenvíen el mail"
          icon="md-mail-unread"
          onPress={() => this.onSendEmailPress()}
        />
      </Menu>
    );
  }
}

export default connect(
  null,
  { sendEmailVefification }
)(VerifyEmailModal);