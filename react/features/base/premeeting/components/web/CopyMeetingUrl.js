// @flow

import React, { Component } from 'react';

import { getCurrentConferenceUrl } from '../../../connection';
import { translate } from '../../../i18n';
import { Icon, IconCopy, IconCheck } from '../../../icons';
import { connect } from '../../../redux';
import logger from '../../logger';

type Props = {

    /**
     * The meeting url.
     */
    url: string,

    /**
     * Used for translation.
     */
    t: Function
};

type State = {

    /**
     * If true it shows the 'copy link' message.
     */
    showCopyLink: boolean,

    /**
     * If true it shows the 'link copied' message.
     */
    showLinkCopied: boolean,
};

const COPY_TIMEOUT = 2000;

/**
 * Component used to copy meeting url on prejoin page.
 */
class CopyMeetingUrl extends Component<Props, State> {

    textarea: Object;

    /**
     * Initializes a new {@code Prejoin} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this.textarea = React.createRef();
        this.state = {
            showCopyLink: false,
            showLinkCopied: false
        };
        this._copyUrl = this._copyUrl.bind(this);
        this._hideCopyLink = this._hideCopyLink.bind(this);
        this._hideLinkCopied = this._hideLinkCopied.bind(this);
        this._showCopyLink = this._showCopyLink.bind(this);
        this._showLinkCopied = this._showLinkCopied.bind(this);
    }

    _copyUrl: () => void;

    /**
     * Callback invoked to copy the url to clipboard.
     *
     * @returns {void}
     */
    _copyUrl() {
        const textarea = this.textarea.current;

        try {
            textarea.select();
            document.execCommand('copy');
            textarea.blur();
            this._showLinkCopied();
            window.setTimeout(this._hideLinkCopied, COPY_TIMEOUT);
        } catch (err) {
            logger.error('error when copying the meeting url');
        }
    }

    _hideLinkCopied: () => void;

    /**
     * Hides the 'Link copied' message.
     *
     * @private
     * @returns {void}
     */
    _hideLinkCopied() {
        this.setState({
            showLinkCopied: false
        });
    }

    _hideCopyLink: () => void;

    /**
     * Hides the 'Copy link' text.
     *
     * @private
     * @returns {void}
     */
    _hideCopyLink() {
        this.setState({
            showCopyLink: false,
            showLinkCopied: false
        });
    }

    _showCopyLink: () => void;

    /**
     * Shows the dark 'Copy link' text on hover.
     *
     * @private
     * @returns {void}
     */
    _showCopyLink() {
        this.setState({
            showCopyLink: true,
            showLinkCopied: false
        });
    }

    _showLinkCopied: () => void;

    /**
     * Shows the green 'Link copied' message.
     *
     * @private
     * @returns {void}
     */
    _showLinkCopied() {
        this.setState({
            showLinkCopied: true,
            showCopyLink: false
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { showCopyLink, showLinkCopied } = this.state;
        const { url, t } = this.props;
        const { _copyUrl, _showCopyLink, _hideCopyLink } = this;
        const src = showLinkCopied ? IconCheck : IconCopy;

        return (
            <div
                className = 'copy-meeting'
                onMouseEnter = { _showCopyLink }
                onMouseLeave = { _hideCopyLink }>
                <div
                    className = { `url ${showLinkCopied ? 'done' : ''}` }
                    onClick = { _copyUrl } >
                    { !showCopyLink && !showLinkCopied && url }
                    { showCopyLink && t('prejoin.copyAndShare') }
                    { showLinkCopied && t('prejoin.linkCopied') }
                    <Icon
                        onClick = { _copyUrl }
                        size = { 24 }
                        src = { src } />
                </div>
                <textarea
                    readOnly = { true }
                    ref = { this.textarea }
                    tabIndex = '-1'
                    value = { url } />
            </div>
        );
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    return {
        url: getCurrentConferenceUrl(state)
    };
}

export default connect(mapStateToProps)(translate(CopyMeetingUrl));
