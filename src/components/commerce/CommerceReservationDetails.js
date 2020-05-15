import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { Divider } from 'react-native-elements';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import moment from 'moment';
import {
  Button,
  Menu,
  MenuItem,
  Input,
  CardSection,
  Toast,
  ReviewCard,
  ButtonGroup,
  AreaComponentRenderer
} from '../common';
import CourtReservationDetails from '../CourtReservationDetails';
import ServiceReservationDetails from '../ServiceReservationDetails';
import {
  onCommerceReservationCancel,
  onReservationsListValueChange,
  onCommerceReviewValueChange,
  onCommerceReviewCreate,
  onCommerceReviewUpdate,
  onCommerceReviewDelete,
  onClientReviewValuesReset,
  onCommerceReviewValuesReset,
  onCashPaymentCreate,
  onCommercePaymentRefund
} from '../../actions';
import { isOneWeekOld, cancelReservationNotificationFormat, trimString } from '../../utils';

class CommerceReservationDetails extends Component {
  constructor(props) {
    super(props);

    const reservation = props.navigation.getParam('reservation');

    this.state = {
      reservation,
      optionsVisible: false,
      cancellationReasonError: '',
      receiptNumber: '',
      confirmDeleteVisible: false,
      isOneWeekOld: isOneWeekOld(reservation.endDate),
      reviewBGIndex: 0,
      confirmCashPayVisible: false,
      paymentRefundVisible: false
    };
  }

  componentDidMount() {
    if (this.state.reservation.clientReview) {
      const { comment, rating } = this.state.reservation.clientReview;
      this.props.onClientReviewValueChange({ comment, rating });
    }

    if (this.state.reservation.commerceReview) {
      const { comment, rating } = this.state.reservation.commerceReview;
      this.props.onCommerceReviewValueChange({ comment, rating });
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.reservations !== this.props.reservations) {
      const res = this.props.reservations.find(res => res.id === this.state.reservation.id);

      if (res && JSON.stringify(res) !== JSON.stringify(this.state.reservation))
        this.setState({ reservation: res });
    }
  }

  componentWillUnmount() {
    this.props.onClientReviewValuesReset();
    this.props.onCommerceReviewValuesReset();
  }

  renderPaymentRefundModal = () => {
    return (
      <Menu
        title={'¿Está seguro que desea cancelar la reserva? Tenga en cuenta que si el pago del cliente fue realizado desde Mercado Pago el dinero le será devuelto automáticamente.'}
        onBackdropPress={() => this.setState({ paymentRefundVisible: false })}
        isVisible={this.state.paymentRefundVisible}
      >
        <MenuItem
          title="Confirmar"
          icon="md-checkmark"
          onPress={() => this.setState({ optionsVisible: true, paymentRefundVisible: false })}
        />
        <Divider style={overlayDividerStyle} />
        <MenuItem title="Cancelar" icon="md-close" onPress={() => this.setState({ paymentRefundVisible: false })} />
      </Menu>
    );
  };

  renderCancelButton = () => {
    if (this.state.reservation.startDate > moment()) {
      return (
        <CardSection style={{ paddingTop: 0 }}>
          <Button
            title="Cancelar Reserva"
            onPress={() => this.state.reservation.payment ? this.setState({ paymentRefundVisible: true }) : this.setState({ optionsVisible: true })}
          />
        </CardSection>
      );
    }
  };

  renderCancellationReasonError = () => {
    const cancellationReason = trimString(this.props.cancellationReason);

    this.props.onReservationsListValueChange({ cancellationReason });
    if (!cancellationReason) {
      this.setState({ cancellationReasonError: 'Debe informar el motivo' });
      return false;
    } else {
      this.setState({ cancellationReasonError: '' });
      return true;
    }
  };

  onCancelReservationPress = () => {
    this.state.reservation.paymentId ? this.setState({ paymentRefundVisible: true }) : this.setState({ optionsVisible: true });
  };

  onBackdropPress = () => {
    this.setState({ optionsVisible: false, cancellationReasonError: '' });
    this.props.onReservationsListValueChange({ cancellationReason: '' });
  };

  onConfirmDelete = () => {
    if (this.renderCancellationReasonError()) {
      const { id, client, court, service, payment, commerce } = this.state.reservation;
      let notification = null;

      if (client)
        notification = cancelReservationNotificationFormat({
          startDate: this.state.reservation.startDate,
          service: court ? `${court.name}` : `${service.name}`,
          actorName: this.props.name,
          receptorName: `${client.firstName}`,
          cancellationReason: this.props.cancellationReason
        });

      if (payment) this.props.onCommercePaymentRefund({ payment });

      this.props.onCommerceReservationCancel({
        commerceId: commerce.commerceId,
        reservationId: id,
        clientId: client.profileId,
        cancellationReason: this.props.cancellationReason,
        navigation: this.props.navigation,
        notification
      });

      this.setState({ optionsVisible: false });
    }
  };

  // *** Review Methods ***

  onSaveReviewHandler = () => {
    if (this.props.commerceRating === 0) {
      Toast.show({ text: 'Debe primero especificar una calificación.' });
    } else {
      if (this.state.reservation.commerceReview) {
        // Si tenia calificación actualizarla
        this.props.onCommerceReviewUpdate({
          reviewId: this.state.reservation.commerceReview.id,
          comment: this.props.commerceComment,
          rating: this.props.commerceRating,
        });
      } else {
        // Si la reserva no tiene calificación, crearla
        this.props.onCommerceReviewCreate({
          clientId: this.state.reservation.client.profileId,
          reservationId: this.state.reservation.id,
          comment: this.props.commerceComment,
          rating: this.props.commerceRating,
        });
      }
    }
  };

  onDeleteReviewHandler = () => {
    this.props.onCommerceReviewDelete({
      reviewId: this.state.reservation.commerceReview.id,
      reservationId: this.state.reservation.id,
    });

    this.setState({ confirmDeleteVisible: false });
  };

  renderConfirmReviewDelete = () => {
    return (
      <Menu
        title="¿Está seguro que desea borrar su reseña?"
        onBackdropPress={() => this.setState({ confirmDeleteVisible: false })}
        isVisible={this.state.confirmDeleteVisible}
      >
        <MenuItem title="Confirmar" icon="md-checkmark" onPress={this.onDeleteReviewHandler} />
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
          disabled={this.state.isOneWeekOld || !this.state.reservation.commerceReview}
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
    return this.props.clientRating ? (
      <View style={{ paddingVertical: 10 }}>
        <ReviewCard
          title="Calificación realizada por el cliente"
          rating={this.props.clientRating}
          commentPlaceholder="El cliente no realizó ningún comentario..."
          commentText={this.props.clientComment}
          readOnly
          fieldsVisible
        />
      </View>
    ) : (
        <View style={{ paddingVertical: 10 }}>
          <ReviewCard title="El cliente no te ha calificado" />
        </View>
      );
  };

  renderCommerceReview = () => {
    const title = this.state.isOneWeekOld && !this.props.commerceRating ? 'Ya pasó el período de calificación' : 'Calificación de la atención';

    return this.state.isOneWeekOld && !this.state.reservation.commerceReview ? (
      <View style={{ paddingVertical: 10 }}>
        <ReviewCard title="Ya pasó el período de calificación" />
      </View>
    ) : (
        <View style={{ paddingVertical: 10 }}>
          <ReviewCard
            title={title}
            onFinishRating={rating => this.props.onCommerceReviewValueChange({ rating })}
            rating={this.props.commerceRating}
            readOnly={this.state.isOneWeekOld}
            onChangeText={comment => this.props.onCommerceReviewValueChange({ comment })}
            commentPlaceholder="Comente sobre el cliente..."
            commentText={this.props.commerceComment}
            fieldsVisible
          />
          {this.renderReviewButtons()}
        </View>
      );
  };

  renderReviewFields = () => {
    if (this.state.reservation.client && this.state.reservation.startDate < moment()) {
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
            buttons={['Calificar al cliente', 'Ver su calificación']}
          />
          {this.state.reviewBGIndex === 0 ? this.renderCommerceReview() : this.renderClientReview()}
          {this.renderConfirmReviewDelete()}
        </CardSection>
      );
    }
  };

  onUserProfilePicturePress = () => {
    const { client } = this.state.reservation;
    this.props.navigation.navigate('clientProfileView', { clientId: client.profileId });
  };

  // *** Payment methods ***

  renderRegisterPaymentConfirmation = () => {
    return (
      <Menu
        title="¿Está seguro que desea registrar el pago en efectivo?"
        onBackdropPress={() => this.setState({ confirmCashPayVisible: false })}
        isVisible={this.state.confirmCashPayVisible || this.props.cashPayRegisterLoading}
      >
        <View style={{ alignSelf: 'stretch' }}>
          <CardSection style={{ padding: 20, paddingLeft: 10, paddingRight: 10 }}>
            <Input
              label="Nro. de comprobante asociado:"
              placeholder="12345"
              color="black"
              onChangeText={receiptNumber => this.setState({ receiptNumber })}
              value={this.state.receiptNumber}
            />
          </CardSection>
          <Divider style={{ backgroundColor: 'grey' }} />
        </View>
        <MenuItem
          title="Confirmar"
          icon="md-checkmark"
          loadingWithText={this.props.cashPayRegisterLoading}
          onPress={() => {
            this.props.onCashPaymentCreate({ reservationId: this.state.reservation.id, receiptNumber: this.state.receiptNumber, navigation: this.props.navigation });
            this.setState({ confirmCashPayVisible: false });
          }}
        />
        <Divider style={{ backgroundColor: 'grey' }} />
        <MenuItem title="Cerrar" icon="md-close" onPress={() => this.setState({ confirmCashPayVisible: false })} />
      </Menu>
    );
  };

  renderRegisterPaymentButton = () => {
    return (
      <CardSection>
        {this.renderRegisterPaymentConfirmation()}
        {this.state.reservation.payment ? (
          <Button
            title="Ver detalle del pago"
            onPress={() => this.props.navigation.navigate('paymentDetails', { reservation: this.state.reservation })}
          />
        ) : (
            <Button title="Registrar pago en efectivo" onPress={() => this.setState({ confirmCashPayVisible: true })} />
          )}
      </CardSection>
    );
  };

  // *** Render method ***

  render() {
    const {
      commerce,
      client,
      clientName,
      clientPhone,
      court,
      service,
      startDate,
      endDate,
      price,
    } = this.state.reservation;

    return (
      <KeyboardAwareScrollView enableOnAndroid contentContainerStyle={scrollViewStyle} extraScrollHeight={60}>
        <Menu
          title="Informar el motivo de la cancelación"
          onBackdropPress={() => this.onBackdropPress()}
          isVisible={this.state.optionsVisible || this.props.cancellationLoading}
        >
          <View style={{ alignSelf: 'stretch' }}>
            <CardSection style={{ padding: 20, paddingLeft: 10, paddingRight: 10 }}>
              <Input
                placeholder="Motivo de cancelación..."
                multiline={true}
                color="black"
                onChangeText={cancellationReason => this.props.onReservationsListValueChange({ cancellationReason })}
                value={this.props.cancellationReason}
                errorMessage={this.state.cancellationReasonError}
                onFocus={() => this.setState({ cancellationReasonError: '' })}
              />
            </CardSection>
            <Divider style={{ backgroundColor: 'grey' }} />
          </View>
          <MenuItem
            title="Confirmar Cancelación"
            icon="md-checkmark"
            loadingWithText={this.props.cancellationLoading}
            onPress={() => this.onConfirmDelete()}
          />
          <Divider style={{ backgroundColor: 'grey' }} />
          <MenuItem title="Cerrar" icon="md-close" onPress={() => this.onBackdropPress()} />
        </Menu>

        {this.renderPaymentRefundModal()}

        <AreaComponentRenderer
          area={commerce.area.areaId}
          sports={
            <CourtReservationDetails
              mode={client && 'client'}
              name={client ? `${client.firstName} ${client.lastName}` : clientName}
              info={client ? client.phone : clientPhone}
              infoIcon="ios-call"
              picture={client && client.profilePicture}
              court={court}
              startDate={startDate}
              endDate={endDate}
              price={price}
              onPicturePress={this.onUserProfilePicturePress}
            />
          }
          hairdressers={
            <ServiceReservationDetails
              mode={client && 'client'}
              name={client ? `${client.firstName} ${client.lastName}` : clientName}
              info={client ? client.phone : clientPhone}
              infoIcon="ios-call"
              picture={client && client.profilePicture}
              service={service}
              startDate={startDate}
              endDate={endDate}
              price={price}
              onPicturePress={this.onUserProfilePicturePress}
            />
          }
        />

        <View style={buttonsContainer}>
          {this.renderRegisterPaymentButton()}
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
  const { cancellationLoading, cancellationReason, reservations } = state.reservationsList;
  const { commerceId, name, mPagoToken } = state.commerceData;
  const { saveLoading, deleteLoading, dataLoading } = state.commerceReviewData;
  const { cashPayRegisterLoading } = state.paymentData;

  return {
    reservations,
    cancellationLoading,
    commerceId,
    name,
    mPagoToken,
    cancellationReason,
    clientRating: state.clientReviewData.rating,
    clientComment: state.clientReviewData.comment,
    clientReviewId: state.clientReviewData.reviewId,
    commerceRating: state.commerceReviewData.rating,
    commerceComment: state.commerceReviewData.comment,
    saveReviewLoading: saveLoading,
    deleteReviewLoading: deleteLoading,
    reviewDataLoading: dataLoading,
    cashPayRegisterLoading
  };
};

export default connect(mapStateToProps, {
  onCommerceReservationCancel,
  onReservationsListValueChange,
  onCommerceReviewValueChange,
  onCommerceReviewCreate,
  onCommerceReviewUpdate,
  onCommerceReviewDelete,
  onClientReviewValuesReset,
  onCommerceReviewValuesReset,
  onCashPaymentCreate,
  onCommercePaymentRefund
})(CommerceReservationDetails);
