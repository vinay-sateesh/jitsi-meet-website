// @flow

import _ from 'lodash';
import { showNotification, hideNotification } from '../../../notifications'
import React from 'react';
import { getLocalParticipant, participantRoleChanged, getParticipantById } from '../../../base/participants'
import { db } from '../../../base/config/firebase'
import VideoLayout from '../../../../../modules/UI/videolayout/VideoLayout';
import { getConferenceNameForTitle } from '../../../base/conference';
import { connect, disconnect } from '../../../base/connection';
import { translate } from '../../../base/i18n';
import { connect as reactReduxConnect } from '../../../base/redux';
import { Chat } from '../../../chat';
import { Filmstrip } from '../../../filmstrip';
import { CalleeInfoContainer } from '../../../invite';
import { LargeVideo } from '../../../large-video';
import { KnockingParticipantList } from '../../../lobby';
import { Prejoin, isPrejoinPageVisible } from '../../../prejoin';
import {
    ToolboxParticipant,
    fullScreenChanged,
    setToolboxAlwaysVisible,
    showToolbox
} from '../../../toolbox';
import { LAYOUTS, getCurrentLayout } from '../../../video-layout';
import { maybeShowSuboptimalExperienceNotification } from '../../functions';
import {
    AbstractConference,
    abstractMapStateToProps
} from '../AbstractConference';
import type { AbstractProps } from '../AbstractConference';

import InviteMore from './InviteMore';
import Labels from './Labels';
import { default as Notice } from './Notice';
import { default as Subject } from './Subject';
import logger from '../../../base/redux/logger';

declare var APP: Object;
declare var config: Object;
declare var interfaceConfig: Object;

/**
 * DOM events for when full screen mode has changed. Different browsers need
 * different vendor prefixes.
 *
 * @private
 * @type {Array<string>}
 */
const FULL_SCREEN_EVENTS = [
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'fullscreenchange'
];

/**
 * The CSS class to apply to the root element of the conference so CSS can
 * modify the app layout.
 *
 * @private
 * @type {Object}
 */
const LAYOUT_CLASSNAMES = {
    [LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW]: 'horizontal-filmstrip',
    [LAYOUTS.TILE_VIEW]: 'tile-view',
    [LAYOUTS.VERTICAL_FILMSTRIP_VIEW]: 'vertical-filmstrip'
};

/**
 * The type of the React {@code Component} props of {@link Conference}.
 */
type Props = AbstractProps & {

    /**
     * Whether the local participant is recording the conference.
     */
    _iAmRecorder: boolean,

    /**
     * The CSS class to apply to the root of {@link Conference} to modify the
     * application layout.
     */
    _layoutClassName: string,

    /**
     * Name for this conference room.
     */
    _roomName: string,

    /**
     * If prejoin page is visible or not.
     */
    _showPrejoin: boolean,

    dispatch: Function,
    t: Function,
    /**
     * Local participant - to be used to know who is initiating a call
     * Particicpants can call the host - their video and audio streams are disabled unless
     * the meeting host accepts the call
     */
    _localParticipant: Object
}

/**
 * The conference page of the Web application.
 */
class Conference extends AbstractConference<Props, *> {
    _onFullScreenChange: Function;
    _onShowToolbar: Function;
    _originalOnShowToolbar: Function;

    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);
        //state
        this.state = {
            // user: auth().currentUser,
            calls: [],
            onCall: [],
            readError: null,
            currentNotificationId: null
        };
        // Throttle and bind this component's mousemove handler to prevent it
        // from firing too often.
        this._originalOnShowToolbar = this._onShowToolbar;
        this._onShowToolbar = _.throttle(
            () => this._originalOnShowToolbar(),
            100,
            {
                leading: true,
                trailing: false
            });

        // Bind event handler so it is only bound once for every instance.
        this._onFullScreenChange = this._onFullScreenChange.bind(this);
    }

    /**
     * Start the connection and get the UI ready for the conference.
     *
     * @inheritdoc
     */
    componentDidMount() {
        /**
         * Listen to firebase to get any incoming calls
         */
        this.setState({ readError: null });
        try {
            db.ref("calls").on("child_added", snap => {

                let calls = [];

                calls.push({ ...snap.val(), key: snap.key });
                this.setState({ calls });

                const customActionHandler = () => {
                    this.state.onCall.push(snap.val());
                    this.state.currentNotificationId ?
                        this.props.dispatch(hideNotification(this.state.currentNotificationId))
                        : console.log('No notification id set');
                    console.log(this.state.onCall);
                    this.props.dispatch(participantRoleChanged(snap.val().uid, 'onCall'));

                    //TODO - if person is already on call disable the call button
                };
                /**
                 * Show someone is calling you only if you are
                 * the meeting host of a conference that contains
                 * that participant
                 */
                if (this.props._localParticipant.role === 'moderator' && this.props._roomName === snap.val().roomName) {
                    //Noitify moderator about call for 15 seconds
                    const notification = showNotification({
                        titleKey: `${snap.val().name} is calling you!`,
                        description: <div>Just ignore this notification if you don't want to pick up</div>,
                        descriptionKey: snap.val().uid,
                        customActionNameKey: 'Accept Call',
                        customActionHandler

                    }, 15000);
                    this.setState({ currentNotificationId: notification.uid });
                    this.props.dispatch(notification);
                }

            });

        } catch (error) {
            this.setState({ readError: error.message });
        }

        document.title = `${this.props._roomName} | ${interfaceConfig.APP_NAME}`;
        this._start();
    }

    /**
     * Calls into legacy UI to update the application layout, if necessary.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidUpdate(prevProps, prevState) {
        /**
         * Check if theres any new participants on a call
         * and update the filmstrip accordingly
         */
        if (this.props._localParticipant.role !== prevProps._localParticipant.role && this.props._localParticipant.role === 'onCall') {

            const participant = getParticipantById(this.props._state, this.state.onCall[this.state.onCall.length - 1].uid);
            logger.info('UPDATED', participant)
            VideoLayout.addRemoteParticipantContainer(participant);
        }
        if (this.props._shouldDisplayTileView
            === prevProps._shouldDisplayTileView) {
            return;
        }

        // TODO: For now VideoLayout is being called as LargeVideo and Filmstrip
        // sizing logic is still handled outside of React. Once all components
        // are in react they should calculate size on their own as much as
        // possible and pass down sizings.
        VideoLayout.refreshLayout();
    }

    /**
     * Disconnect from the conference when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._deleteCalls();
        APP.UI.unbindEvents();

        FULL_SCREEN_EVENTS.forEach(name =>
            document.removeEventListener(name, this._onFullScreenChange));

        APP.conference.isJoined() && this.props.dispatch(disconnect());
    }
    /**
     * We don't need to keep calls made during the meeting
     * So after meeting ends delete them!
     * Currently they are deleted immediately
     * TODO - or delete them if they get rejected by host
     * or add a timeout after which it is assumed
     * that the host rejected the call
     */
    _deleteCalls() {
        console.log(this.state.calls);
        this.state.calls.map((call) => {
            if (call.roomName === this.props._roomName) {

                var userRef = db.ref('calls/' + call.key);
                userRef.on('value', (snap) => {
                    console.log(snap.val());
                })
                userRef.remove();

            }
        })
        this.setState({ calls: [] })


    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const dateFromDb = this.state.calls[0] ? new Date(this.state.calls[0].timestamp).getTime() : Date.now();
        console.log("CALLS", (Date.now() - dateFromDb) / 1000);
        // console.log("local participant", this.props._localParticipant);
        const {
            // XXX The character casing of the name filmStripOnly utilized by
            // interfaceConfig is obsolete but legacy support is required.
            filmStripOnly: filmstripOnly
        } = interfaceConfig;
        const {
            _iAmRecorder,
            _layoutClassName,
            _showPrejoin
        } = this.props;
        const hideLabels = filmstripOnly || _iAmRecorder;

        return (
            <div
                className={_layoutClassName}
                id='videoconference_page'
                onMouseMove={this._onShowToolbar}>

                <Notice />
                <Subject />
                <InviteMore />
                <div id='videospace'>
                    <LargeVideo />
                    <KnockingParticipantList />
                    {hideLabels || <Labels />}
                    <Filmstrip filmstripOnly={filmstripOnly} />
                </div>

                {filmstripOnly || _showPrejoin || <ToolboxParticipant roomName={this.props._roomName} localParticipant={this.props._localParticipant} />}
                {filmstripOnly || <Chat />}

                {this.renderNotificationsContainer()}

                <CalleeInfoContainer />

                {!filmstripOnly && _showPrejoin && <Prejoin />}
            </div>
        );
    }

    /**
     * Updates the Redux state when full screen mode has been enabled or
     * disabled.
     *
     * @private
     * @returns {void}
     */
    _onFullScreenChange() {
        this.props.dispatch(fullScreenChanged(APP.UI.isFullScreen()));
    }

    /**
     * Displays the toolbar.
     *
     * @private
     * @returns {void}
     */
    _onShowToolbar() {
        this.props.dispatch(showToolbox());
    }

    /**
     * Until we don't rewrite UI using react components
     * we use UI.start from old app. Also method translates
     * component right after it has been mounted.
     *
     * @inheritdoc
     */
    _start() {
        APP.UI.start();

        APP.UI.registerListeners();
        APP.UI.bindEvents();

        FULL_SCREEN_EVENTS.forEach(name =>
            document.addEventListener(name, this._onFullScreenChange));

        const { dispatch, t } = this.props;

        dispatch(connect());

        maybeShowSuboptimalExperienceNotification(dispatch, t);

        interfaceConfig.filmStripOnly
            && dispatch(setToolboxAlwaysVisible(true));
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code Conference} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        ...abstractMapStateToProps(state),
        _state: state,
        _localParticipant: getLocalParticipant(state),
        _iAmRecorder: state['features/base/config'].iAmRecorder,
        _layoutClassName: LAYOUT_CLASSNAMES[getCurrentLayout(state)],
        _roomName: getConferenceNameForTitle(state),
        _showPrejoin: isPrejoinPageVisible(state)
    };
}

export default reactReduxConnect(_mapStateToProps)(translate(Conference));
