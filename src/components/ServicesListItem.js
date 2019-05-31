import React, { Component } from 'react';
import { View } from 'react-native';
import { ListItem, Button, Overlay, Divider } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { connect } from 'react-redux';
import { serviceDelete } from '../actions';

class ServicesListItem extends Component {
    state = { visible: false };

    onOptionsPress() {
        this.setState({ visible: !this.state.visible });
    }

    onDeletePress() {
        this.props.serviceDelete({ id: this.props.service });

        this.setState({ visible: !this.state.visible });
    }

    render() {
        const { name, duration, price, id } = this.props.service;

        return (
            <View style={{ flex: 1 }}>
                <Overlay
                    height='auto'
                    overlayStyle={{ padding: 0 }}
                    onBackdropPress={this.onOptionsPress.bind(this)}
                    isVisible={this.state.visible}  >
                    <View>
                        <Button
                            type='clear'
                            title='Editar'
                            buttonStyle={{ padding: 15 }}
                        />
                        <Divider style={{ backgroundColor: 'grey', marginLeft: 10, marginRight: 10 }} />
                        <Button
                            type='clear'
                            title='Eliminar'
                            buttonStyle={{ padding: 15 }}
                            titleStyle={{ color: 'red' }}
                            onPress={this.onDeletePress.bind(this)}
                        />
                    </View>
                </Overlay>

                <ListItem
                    title={name}
                    subtitle={`Duracion: ${duration} min.`}
                    rightTitle={`$${price}`}
                    key={id}
                    onLongPress={this.onOptionsPress.bind(this)}
                    rightElement={
                        <Button
                            type='clear'
                            buttonStyle={{ padding: 0 }}
                            containerStyle={{ borderRadius: 15, overflow: 'hidden' }}
                            onPress={this.onOptionsPress.bind(this)}
                            icon={
                                <Icon
                                    name='more-vert'
                                    size={22}
                                    color='grey'
                                />
                            }
                        />
                    }
                    bottomDivider
                />
            </View>
        );
    }
}

export default connect(null, { serviceDelete })(ServicesListItem);