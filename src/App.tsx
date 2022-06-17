import { useEffect, useState } from 'react';
import './App.scss';
import { store, StoreContext, StoreState } from './store';
import LoginScreen from './login/LoginScreen';

const App = () => {
    const [ storeState, setStoreState ] = useState<StoreState>({});
    const [ screen, setScreen ] = useState<JSX.Element | undefined>(undefined);

    useEffect(() => {
        const dataLoader = async () => {
            const archiveConfig = await store.getArchiveConfig();
            const fonts = await store.loadFonts();

            const state = {
                archiveConfig,
                fontsLoaded: true,
                fonts,
            };

            setStoreState(state);
        };

        dataLoader().catch(console.error);
    }, []);

    useEffect(() => {
        if (storeState.fontsLoaded) {
            console.log('Fonts Loaded');
            setScreen(<LoginScreen />);
        }
    }, [ storeState ]);

    return (
        <StoreContext.Provider value={storeState}>
            <div className="client-app">
                <div className="rjs-header">
                    <img className="rjs-logo" src="https://i.imgur.com/QSXNzwC.png" alt="RuneJS"/>

                    <a href="https://discord.gg/5P74nSh" target="_blank" rel="noreferrer" tabIndex={-1}>
                        <img
                            src="https://img.shields.io/discord/678751302297059336?label=RuneJS%20Discord&amp;logo=discord"
                            alt="RuneJS Discord"/>
                    </a>
                </div>

                {screen}
            </div>
        </StoreContext.Provider>
    );
};

export default App;
