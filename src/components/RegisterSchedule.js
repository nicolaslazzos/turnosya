import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, View, RefreshControl } from 'react-native';
import { Fab } from 'native-base';
import { Spinner } from './common';
import {
  onScheduleValueChange,
  onScheduleCreate,
  onScheduleRead
} from '../actions';
import { MAIN_COLOR } from '../constants';
import RegisterScheduleItem from './RegisterScheduleItem';

class RegisterSchedule extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      headerRight: navigation.getParam('rightIcon')
    };
  };

  componentWillMount() {
    this.props.navigation.setParams({ rightIcon: this.renderSaveButton() });
    this.props.onScheduleRead();
  }

  renderSaveButton = () => {
    return (
      <Ionicons
        name="md-checkmark"
        size={28}
        color="white"
        style={{ marginRight: 15 }}
        onPress={() => this.props.onScheduleCreate(this.props.cards)}
      />
    );
  };

  onAddPress = () => {
    const { cards, selectedDays, onScheduleValueChange } = this.props;
    if (cards.length === 0) {
      onScheduleValueChange({
        prop: 'cards',
        value: cards.concat([{ ...emptyCard, id: 0 }])
      });
    } else if (
      selectedDays.length < 7 &&
      !this.props.cards.find(card => card.days.length === 0)
    ) {
      onScheduleValueChange({
        prop: 'cards',
        value: cards.concat([
          { ...emptyCard, id: cards[cards.length - 1].id + 1 }
        ])
      });
    }
  };

  renderRow = ({ item }) => {
    return (
      <RegisterScheduleItem card={item} navigation={this.props.navigation} />
    );
  };

  render() {
    if (this.props.loading) {
      return <Spinner />;
    }

    return (
      <View style={{ flex: 1 }}>
        <FlatList
          data={this.props.cards}
          renderItem={this.renderRow}
          keyExtractor={card => card.id.toString()}
          extraData={this.props}
          contentContainerStyle={{ paddingBottom: 95 }}
          refreshControl={
            <RefreshControl
              refreshing={this.props.refreshing}
              colors={[MAIN_COLOR]}
              tintColor={MAIN_COLOR}
            />
          }
        />
        <Fab
          style={{ backgroundColor: MAIN_COLOR }}
          position="bottomRight"
          onPress={() => this.onAddPress()}
        >
          <Ionicons name="md-add" />
        </Fab>
      </View>
    );
  }
}

const emptyCard = {
  firstShiftStart: '',
  firstShiftEnd: '',
  secondShiftStart: null,
  secondShiftEnd: null,
  days: []
};

const mapStateToProps = state => {
  const { cards, selectedDays, loading, refreshing } = state.registerSchedule;
  return { cards, selectedDays, loading, refreshing };
};

export default connect(
  mapStateToProps,
  { onScheduleValueChange, onScheduleCreate, onScheduleRead }
)(RegisterSchedule);
