import './LoginScreen.scss';
import { useEffect, useState } from 'react';
import { store } from '../store';
import Sprite from '../store/sprites/Sprite';
import TitleButton from './TitleButton';
import Text from '../store/fonts/Text';
import TextField from '../common/text-field/TextField';


export enum LoginState {
    WELCOME = 0,
    LOGIN_FORM = 1,
}

const LoginScreen = () => {
    const [ loginBackground, setLoginBackground ] = useState<string>('');
    const [ loginState, setLoginState ] = useState(LoginState.WELCOME);

    const titleScreenText = [
        'An account is not required to play',
        'RuneJS, all you need to do is login',
        'with any username and password to',
        'create a character.',
    ];

    const submitCredentials = () => {
        console.log('credentials submitted');
    };

    useEffect(() => {
        const titleBgFetcher = async () =>
            setLoginBackground(await store.getLoginBackground());

        titleBgFetcher().catch(console.error);
    });

    let titleBox: JSX.Element;

    if (loginState === LoginState.LOGIN_FORM) {
        titleBox = (
            <div className="rjs-titlebox rjs-titlebox-loginform">
                <Text font="b12_full" color={16776960} align="center"
                      dropShadow className="rjs-title">
                    Enter your username &amp; password.
                </Text>

                <form>
                    <TextField label="Username:" type="text" maxLength={12}
                               className="rjs-login-field" autoFocus tabIndex={1} />

                    <TextField label="Password:" type="password" maxLength={20}
                               className="rjs-login-field" tabIndex={2} onEnter={submitCredentials} />
                </form>

                <div className="rjs-buttons">
                    <TitleButton id="title-login-button" className="rjs-button-login">
                        Login
                    </TitleButton>

                    <TitleButton id="title-cancel-button" className="rjs-button-cancel"
                                 onClick={() => setLoginState(LoginState.WELCOME)}>
                        Cancel
                    </TitleButton>
                </div>
            </div>
        );
    } else {
        titleBox = (
            <div className="rjs-titlebox rjs-titlebox-welcome">
                <Text font="b12_full" color={16776960} align="center"
                      dropShadow className="rjs-title">
                    Welcome to RuneJS
                </Text>

                {titleScreenText.map((text, i) => (
                    <Text font="b12_full" color={16777215} align="center"
                          dropShadow className="rjs-info-text" key={i}>
                        { text }
                    </Text>
                ))}

                <TitleButton id="title-welcome-button" className="rjs-button-welcome"
                             onClick={() => setLoginState(LoginState.LOGIN_FORM)}>
                    Login
                </TitleButton>
            </div>
        );
    }

    return (
        <div className="rjs-login">
            <div className="rjs-login-background-left">
                <img src={ loginBackground } alt="Loading, please wait..."/>
            </div>

            <div className="rjs-login-background-right">
                <img src={ loginBackground } alt=" "/>
            </div>

            <Sprite name="logo" canvasId="logo" className="rjs-logo" />

            <Sprite name="titlebox" canvasId="titlebox" className="rjs-titlebox-bg"/>

            { titleBox }
        </div>
    );
};

export default LoginScreen;
