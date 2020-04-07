import React, { Component } from 'react';
import { ListItem, Button } from 'react-native-elements';
import { Text, View } from 'react-native';
import { withNavigation } from 'react-navigation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { connect } from 'react-redux';
import { onFavoriteCommerceRegister, onFavoriteCommerceDelete, onReservationValueChange } from '../../actions';

class CommerceListItem extends Component {
  state = { favorite: false };

  componentDidMount() {
    this.setState({
      favorite: this.props.favoriteCommerces.includes(this.props.commerce.commerceId)
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.favoriteCommerces !== this.props.favoriteCommerces) {
      this.setState({
        favorite: this.props.favoriteCommerces.includes(this.props.commerce.commerceId)
      });
    }
  }

  onFavoritePress = commerceId => {
    this.state.favorite
      ? this.props.onFavoriteCommerceDelete(commerceId)
      : this.props.onFavoriteCommerceRegister(commerceId);

    this.setState({ favorite: !this.state.favorite });
  };

  onCommercePress = () => {
    this.props.onReservationValueChange({ commerce: this.props.commerce });
    this.props.navigation.navigate('commerceProfileView', { navigatedFrom: this.props.navigation.state.routeName });
  };

  renderSubtitle = () => {
    const { area, address, city, province } = this.props.commerce;

    return (
      <View>
        <Text style={{ color: 'grey', fontSize: 14 }}>{area.name}</Text>
        <Text style={{ color: 'grey', fontSize: 12 }}>{`${address}, ${city}, ${province.name}`}</Text>
      </View>
    );
  };

  render() {
    const { name, profilePicture, commerceId } = this.props.commerce;

    return (
      <ListItem
        leftAvatar={{
          source: profilePicture ? { uri: profilePicture } : null,
          icon: { name: 'store', type: 'material' },
          size: 'medium'
        }}
        title={name}
        subtitle={this.renderSubtitle()}
        rightIcon={
          <Button
            type="clear"
            containerStyle={{ borderRadius: 15, overflow: 'hidden' }}
            icon={<Icon name="favorite" color={this.state.favorite ? 'red' : '#c4c4c4'} size={25} />}
            buttonStyle={{ padding: 0 }}
            onPress={() => this.onFavoritePress(commerceId)}
          />
        }
        onPress={this.onCommercePress}
        bottomDivider
      />
    );
  }
}

const mapStateToProps = state => {
  const { favoriteCommerces } = state.commercesList;

  return {
    favoriteCommerces
  };
};

export default withNavigation(
  connect(mapStateToProps, {
    onFavoriteCommerceRegister,
    onFavoriteCommerceDelete,
    onReservationValueChange
  })(CommerceListItem)
);
