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
  onClientReviewCreate,
  onClientReviewUpdate,
  onClientReviewDelete,
  onClientReviewValueChange,
  onCommerceReviewValueChange,
  onCommerceReviewValuesReset,
  onClientReviewValuesReset,
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

    if (this.state.reservation.clientReview) {
      const { comment, rating } = this.state.reservation.clientReview;
      this.props.onClientReviewValueChange({ comment, rating })
    }

    if (this.state.reservation.commerceReview) {
      const { comment, rating } = this.state.reservation.commerceReview;
      this.props.onCommerceReviewValueChange({ comment, rating })
    }

    // this.props.onCommerceMPagoTokenRead(this.state.reservation.commerceId);
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
      Toast.show({ text: 'No puede cancelar el turno, el tiempo mínimo permitido es ' + stringFormatHours(reservationMinCancelTime) });
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
    if (this.props.clientRating === 0) {
      Toast.show({ text: 'Debe primero especificar una calificación.' });
    } else {
      if (this.state.reservation.clientReview) {
        // Si tenia calificacion actualizarla
        this.props.onClientReviewUpdate({
          reviewId: this.state.reservation.clientReview.id,
          comment: this.props.clientComment,
          rating: this.props.clientRating,
        });
      } else {
        // Si la reserva no tiene calificacion, crearla
        this.props.onClientReviewCreate({
          commerceId: this.state.reservation.commerce.commerceId,
          reservationId: this.state.reservation.id,
          comment: this.props.clientComment,
          rating: this.props.clientRating,
        });
      }
    }
  };

  onCancelReservationButtonPress = () => {
    const { startDate, id, commerce, commerceId, employee, court, service, client } = this.state.reservation;

    const notification = cancelReservationNotificationFormat({
      startDate,
      service: court ? `${court.name}` : `${service.name}`,
      actorName: `${client.firstName} ${client.lastName}`,
      receptorName: `${commerce.name}`
    });

    this.props.onClientReservationCancel({
      reservationId: id,
      commerceId,
      employeeId: employee ? employee.id : null,
      navigation: this.props.navigation,
      notification
    });

    this.setState({ optionsVisible: false });
  };

  deleteReview = () => {
    this.props.onClientReviewDelete(this.state.reservation.clientReview.id);
    this.setState({ confirmDeleteVisible: false, reservation: { ...this.state.reservation, clientReview: null } });
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
          disabled={this.state.isOneWeekOld || !this.state.reservation.clientReview}
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

  renderClientReview = () => {
    const title = this.state.isOneWeekOld && !this.props.clientRating ? 'Ya pasó el período de calificación' : 'Calificación de la atención';

    return this.state.isOneWeekOld && !this.state.reservation.clientReview ? (
      <View style={{ paddingVertical: 10 }}>
        <ReviewCard title="Ya pasó el período de calificación" />
      </View>
    ) : this.state.reservation.payment ? (
      <View style={{ paddingVertical: 10 }}>
        <ReviewCard
          title={title}
          onFinishRating={rating => this.props.onClientReviewValueChange({ rating })}
          rating={this.props.clientRating}
          readOnly={this.state.isOneWeekOld}
          onChangeText={comment => this.props.onClientReviewValueChange({ comment })}
          commentPlaceholder="Deje un comentario sobre la atención..."
          commentText={this.props.clientComment}
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

  renderCommerceReview = () => {
    return this.props.commerceRating ? (
      <View style={{ paddingVertical: 10 }}>
        <ReviewCard
          title="Calificación realizada por el negocio"
          rating={this.props.commerceRating}
          commentPlaceholder="El negocio no realizó ningún comentario..."
          commentText={this.props.commerceComment}
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
          {this.state.reviewBGIndex === 0 ? this.renderClientReview() : this.renderCommerceReview()}
          {this.renderConfirmReviewDelete()}
        </CardSection>
      );
    }
  };

  // ** Payment buttons **

  renderPayButton = () => {
    return this.state.reservation.payment ? (
      <CardSection>
        <Button
          title="Ver detalle del pago"
          onPress={() => this.props.navigation.navigate('paymentDetails', { reservation: this.state.reservation })}
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
    const { areaId, commerce, service, employee, court, endDate, startDate, price } = this.state.reservation;

    if (this.props.loadingSchedule) return <Spinner />;

    return (
      <KeyboardAwareScrollView enableOnAndroid contentContainerStyle={scrollViewStyle} extraScrollHeight={60}>
        <Menu
          title={"¿Está seguro que desea cancelar el turno? Tenga en cuenta que si ya realizó el pago mediante MercadoPago, el dinero no le será devuelto"}
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
  const { saveLoading, deleteLoading } = state.clientReviewData;
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
    mPagoToken
  };
};

export default connect(mapStateToProps, {
  onClientReservationCancel,
  onScheduleRead,
  onClientReviewCreate,
  onClientReviewUpdate,
  onClientReviewDelete,
  onClientReviewValueChange,
  onCommerceReviewValueChange,
  onCommerceReviewValuesReset,
  onClientReviewValuesReset,
  onCommerceMPagoTokenRead
})(ClientReservationDetails);
