import React, { Component } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import moment from 'moment';
import { connect } from 'react-redux';
import { Divider } from 'react-native-elements';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CourtReservationDetails from '../CourtReservationDetails';
import ServiceReservationDetails from '../ServiceReservationDetails';
import { stringFormatHours, isOneWeekOld, cancelReservationNotificationFormat } from '../../utils';
import {
  CardSection,
  Button,
  Menu,
  MenuItem,
  Spinner,
  Toast,
  ReviewCard,
  ButtonGroup,
  AreaComponentRenderer
} from '../common';
import {
  onClientReservationCancel,
  onScheduleRead,
  onCommerceReviewCreate,
  onCommerceReviewReadById,
  onCommerceReviewUpdate,
  onCommerceReviewDelete,
  onCommerceReviewValueChange,
  onCommerceReviewValuesReset,
  onClientReviewValuesReset,
  onClientReviewReadById,
  onCommerceMPagoTokenRead
} from '../../actions';

class ClientReservationDetails extends Component {
  constructor(props) {
    super(props);

    const reservation = props.navigation.getParam('reservation');

    this.state = {
      reservation,
      optionsVisible: false,
      confirmDeleteVisible: false,
      isOneWeekOld: isOneWeekOld(reservation.endDate),
      reviewBGIndex: 0
    };
  }

  // ** Lifecycle methods **

  componentDidMount() {
    // puse esta misma action para que traiga el tiempo minimo de cancelacion
    this.props.onScheduleRead({
      commerceId: this.state.reservation.commerceId,
      selectedDate: this.state.reservation.startDate,
      employeeId: this.state.reservation.employeeId || null
    });

    this.props.onCommerceReviewReadById({
      commerceId: this.state.reservation.commerceId,
      reviewId: this.state.reservation.reviewId
    });

    this.props.onClientReviewReadById({
      clientId: this.props.clientId,
      reviewId: this.state.reservation.receivedReviewId
    });

    this.props.onCommerceMPagoTokenRead(this.state.reservation.commerceId);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.reservations !== this.props.reservations) {
      const res = this.props.reservations.find(res => res.id === this.state.reservation.id);

      if (res && JSON.stringify(res) !== JSON.stringify(this.state.reservation))
        this.setState({ reservation: res });
    }
  }

  componentWillUnmount() {
    this.props.onCommerceReviewValuesReset();
    this.props.onClientReviewValuesReset();
  }

  // ** cancellation methods **

  onCancelButtonPress = () => {
    const { reservationMinCancelTime } = this.props;
    const { startDate } = this.state.reservation;
    if (startDate.diff(moment(), 'hours', 'minutes') > reservationMinCancelTime)
      this.setState({ optionsVisible: true });
    else
      Toast.show({
        text: 'No puede cancelar el turno, el tiempo mínimo permitido es ' + stringFormatHours(reservationMinCancelTime)
      });
  };

  renderCancelButton = () => {
    const { startDate } = this.state.reservation;
    if (startDate > moment()) {
      return (
        <CardSection style={{ paddingTop: 0 }}>
          <Button title="Cancelar Reserva" onPress={this.onCancelButtonPress} />
        </CardSection>
      );
    }
  };

  // ** Commerce Review methods **

  onSaveReviewHandler = () => {
    if (this.props.commerceRating === 0) {
      Toast.show({ text: 'Debe primero especificar una calificación.' });
    } else {
      if (this.props.commerceReviewId) {
        // Si tenia calificacion actualizarla
        this.props.onCommerceReviewUpdate({
          commerceId: this.state.reservation.commerceId,
          comment: this.props.commerceComment,
          rating: this.props.commerceRating,
          reviewId: this.props.commerceReviewId
        });
      } else {
        // Si la reserva no tiene calificacion, crearla
        this.props.onCommerceReviewCreate({
          commerceId: this.state.reservation.commerceId,
          comment: this.props.commerceComment,
          rating: this.props.commerceRating,
          reservationId: this.state.reservation.id
        });
      }
    }
  };

  onCancelReservationButtonPress = () => {
    const { startDate, id, commerce, commerceId, employeeId, court, service } = this.state.reservation;
    const { firstName, lastName } = this.props;

    const notification = cancelReservationNotificationFormat({
      startDate,
      service: court ? `${court.name}` : `${service.name}`,
      actorName: `${firstName} ${lastName}`,
      receptorName: `${commerce.name}`
    });

    this.props.onClientReservationCancel({
      reservationId: id,
      commerceId,
      navigation: this.props.navigation,
      notification: { ...notification, employeeId }
    });

    this.setState({ optionsVisible: false });
  };

  deleteReview = () => {
    this.setState({
      confirmDeleteVisible: false,
      reservation: { ...this.state.reservation, reviewId: null }
    });
    this.props.onCommerceReviewDelete({
      commerceId: this.state.reservation.commerceId,
      reservationId: this.state.reservation.id,
      reviewId: this.props.commerceReviewId
    });
  };

  renderConfirmReviewDelete = () => {
    return (
      <Menu
        title="¿Está seguro que desea borrar su reseña?"
        onBackdropPress={() => this.setState({ confirmDeleteVisible: false })}
        isVisible={this.state.confirmDeleteVisible}
      >
        <MenuItem title="Confirmar" icon="md-checkmark" onPress={this.deleteReview} />
        <Divider style={overlayDividerStyle} />
        <MenuItem title="Cancelar" icon="md-close" onPress={() => this.setState({ confirmDeleteVisible: false })} />
      </Menu>
    );
  };

  renderReviewButtons = () => {
    return this.state.isOneWeekOld ? null : (
      <CardSection style={{ flexDirection: 'row' }}>
        <Button
          title="Borrar"
          outerContainerStyle={{ flex: 1 }}
          onPress={() => this.setState({ confirmDeleteVisible: true })}
          loading={this.props.deleteReviewLoading}
          disabled={this.state.isOneWeekOld || !this.props.commerceReviewId}
        />
        <Button
          title="Guardar"
          outerContainerStyle={{ flex: 1 }}
          onPress={this.onSaveReviewHandler}
          loading={this.props.saveReviewLoading}
          disabled={this.state.isOneWeekOld}
        />
      </CardSection>
    );
  };

  renderCommerceReview = () => {
    const title =
      this.state.isOneWeekOld && !this.props.commerceRating
        ? 'Ya pasó el período de calificación'
        : 'Calificación de la atención';

    return this.state.isOneWeekOld && !this.props.commerceReviewId ? (
      <View style={{ paddingVertical: 10 }}>
        <ReviewCard title="Ya pasó el período de calificación" />
      </View>
    ) : this.state.reservation.paymentId ? (
      <View style={{ paddingVertical: 10 }}>
        <ReviewCard
          title={title}
          onFinishRating={rating => this.props.onCommerceReviewValueChange({ rating })}
          rating={this.props.commerceRating}
          readOnly={this.state.isOneWeekOld}
          onChangeText={comment => this.props.onCommerceReviewValueChange({ comment })}
          commentPlaceholder="Deje un comentario sobre la atención..."
          commentText={this.props.commerceComment}
          fieldsVisible
        />
        {this.renderReviewButtons()}
      </View>
    ) : (
          <View style={{ paddingVertical: 10 }}>
            <ReviewCard title="Antes de poder calificar al negocio debe registrarse el pago del turno" />
          </View>
        );
  };

  renderClientReview = () => {
    return this.props.clientRating ? (
      <View style={{ paddingVertical: 10 }}>
        <ReviewCard
          title="Calificación realizada por el negocio"
          rating={this.props.clientRating}
          commentPlaceholder="El negocio no realizó ningún comentario..."
          commentText={this.props.clientComment}
          readOnly
          fieldsVisible
        />
      </View>
    ) : (
        <View style={{ paddingVertical: 10 }}>
          <ReviewCard title="El negocio no te ha calificado" />
        </View>
      );
  };

  renderReviewFields = () => {
    if (this.state.reservation.startDate < moment()) {
      return (
        <CardSection style={{ flex: 1 }}>
          <Divider
            style={{
              backgroundColor: 'gray',
              marginHorizontal: 10,
              marginTop: 5,
              marginBottom: 15
            }}
          />
          <ButtonGroup
            onPress={index => this.setState({ reviewBGIndex: index })}
            selectedIndex={this.state.reviewBGIndex}
            buttons={['Calificar al negocio', 'Ver su calificación']}
          />
          {this.state.reviewBGIndex === 0 ? this.renderCommerceReview() : this.renderClientReview()}
          {this.renderConfirmReviewDelete()}
        </CardSection>
      );
    }
  };

  // ** Payment buttons **

  renderPayButton = () => {
    return this.state.reservation.paymentId ? (
      <CardSection>
        <Button
          title="Ver detalle del pago"
          onPress={() =>
            this.props.navigation.navigate('paymentDetails', {
              reservation: this.state.reservation
            })
          }
        />
      </CardSection>
    ) : this.props.mPagoToken ? (
      <CardSection>
        <Button
          title="Pagar con Mercado Pago"
          color="#009EE3"
          icon={
            <Image
              source={require('../../../assets/mercado-pago-logo.png')}
              style={{ height: 21, width: 31, marginRight: 10 }}
              resizeMode="contain"
            />
          }
          onPress={() =>
            this.props.navigation.navigate('paymentForm', {
              reservation: this.state.reservation,
              mPagoToken: this.props.mPagoToken
            })
          }
        />
      </CardSection>
    ) : null;
  };

  // ** Render method **

  render() {
    const { areaId, commerce, service, employee, court, endDate, startDate, light, price } = this.state.reservation;

    if (this.props.loadingSchedule) return <Spinner />;

    return (
      <KeyboardAwareScrollView enableOnAndroid contentContainerStyle={scrollViewStyle} extraScrollHeight={60}>
        <Menu
          title={"¿Está seguro que desea cancelar el turno? Tenga en cuenta que si ya realizó el pago mediante MercadoPago,"
            + " el dinero no le será devuelto"}
          onBackdropPress={() => this.setState({ optionsVisible: false })}
          isVisible={this.state.optionsVisible || this.props.loadingReservations}
        >
          <MenuItem
            title="Aceptar"
            icon="md-checkmark"
            loadingWithText={this.props.loadingReservations}
            onPress={() => this.onCancelReservationButtonPress()}
          />
          <Divider style={overlayDividerStyle} />
          <MenuItem title="Cancelar" icon="md-close" onPress={() => this.setState({ optionsVisible: false })} />
        </Menu>

        <AreaComponentRenderer
          area={areaId}
          sports={
            <CourtReservationDetails
              mode="commerce"
              name={commerce.name}
              picture={commerce.profilePicture}
              info={commerce.address + ', ' + commerce.city + ', ' + commerce.province.name}
              infoIcon="md-pin"
              court={court}
              startDate={startDate}
              endDate={endDate}
              price={price}
              light={light}
            />
          }
          hairdressers={
            <ServiceReservationDetails
              mode="commerce"
              name={commerce.name}
              picture={commerce.profilePicture}
              info={commerce.address + ', ' + commerce.city + ', ' + commerce.province.name}
              infoIcon="md-pin"
              service={service}
              employee={employee}
              startDate={startDate}
              endDate={endDate}
              price={price}
            />
          }
        />

        <View style={buttonsContainer}>
          {this.renderPayButton()}
          {this.renderCancelButton()}
          {this.renderReviewFields()}
        </View>
      </KeyboardAwareScrollView>
    );
  }
}

const { overlayDividerStyle, scrollViewStyle, buttonsContainer } = StyleSheet.create({
  overlayDividerStyle: {
    backgroundColor: 'grey'
  },
  scrollViewStyle: {
    flexGrow: 1,
    alignSelf: 'stretch'
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignSelf: 'stretch'
  }
});

const mapStateToProps = state => {
  const { reservations } = state.clientReservationsList;
  const loadingReservations = state.clientReservationsList.loading;
  const { reservationMinCancelTime, loadingSchedule } = state.commerceSchedule;
  const { saveLoading, deleteLoading } = state.commerceReviewData;
  const { clientId, firstName, lastName } = state.clientData;
  const { mPagoToken } = state.commerceData;

  return {
    reservations,
    loadingReservations,
    loadingSchedule,
    reservationMinCancelTime,
    saveReviewLoading: saveLoading,
    deleteReviewLoading: deleteLoading,
    commerceRating: state.commerceReviewData.rating,
    commerceComment: state.commerceReviewData.comment,
    commerceReviewId: state.commerceReviewData.reviewId,
    clientRating: state.clientReviewData.rating,
    clientComment: state.clientReviewData.comment,
    clientId,
    firstName,
    lastName,
    mPagoToken
  };
};

export default connect(mapStateToProps, {
  onClientReservationCancel,
  onScheduleRead,
  onCommerceReviewCreate,
  onCommerceReviewReadById,
  onCommerceReviewUpdate,
  onCommerceReviewDelete,
  onCommerceReviewValueChange,
  onCommerceReviewValuesReset,
  onClientReviewValuesReset,
  onClientReviewReadById,
  onCommerceMPagoTokenRead
})(ClientReservationDetails);
