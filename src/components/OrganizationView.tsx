import React, { useState } from 'react';
import {
    Players,
    SelectPlayer,
    InputBox,
    ProfileChoices,
    PasswordBox,
    NewOrgButton
} from './styles';
import type { DocumentData } from 'firebase/firestore';

interface OrganizationViewProps {
    organizations: DocumentData[];
    handleJoin: (orgId: string, passwordAttempt: string) => Promise<boolean>;
    handleCreate: (name: string, password: string) => Promise<void>;
    loading: boolean;
    themeMode: 'light' | 'dark';
}

export const OrganizationView: React.FC<OrganizationViewProps> = ({
    organizations,
    handleJoin,
    handleCreate,
    loading,
    themeMode
}) => {
    // State for creating new org
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgPassword, setNewOrgPassword] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // State for joining existing org
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [passwordAttempt, setPasswordAttempt] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const onJoinClick = async () => {
        if (selectedOrgId && passwordAttempt) {
            const success = await handleJoin(selectedOrgId, passwordAttempt);
            if (!success) {
                setErrorMsg("Incorrect password");
            } else {
                setErrorMsg("");
                setSelectedOrgId(null);
                setPasswordAttempt("");
            }
        }
    };

    const onCreateClick = async () => {
        if (newOrgName && newOrgPassword) {
            await handleCreate(newOrgName, newOrgPassword);
            setNewOrgName('');
            setNewOrgPassword('');
            setIsCreating(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <h2>Select Organization</h2>

            {loading ? <p>Loading organizations...</p> : (
                <Players>
                    {organizations.map(org => (
                        <SelectPlayer
                            key={org.id}
                            onClick={() => {
                                setSelectedOrgId(org.id);
                                setErrorMsg("");
                                setPasswordAttempt("");
                            }}
                        >
                            {org.name}
                        </SelectPlayer>
                    ))}
                </Players>
            )}

            {/* Modal or Section for Entering Password */}
            {selectedOrgId && (
                <PasswordBox>
                    <h3>Enter Password for {organizations.find(o => o.id === selectedOrgId)?.name}</h3>
                    <input
                        type="password"
                        placeholder="Password"
                        value={passwordAttempt}
                        onChange={(e) => setPasswordAttempt(e.target.value)}
                        style={{ padding: '0.5rem' }}
                    />
                    {errorMsg && <span style={{ color: 'red' }}>{errorMsg}</span>}
                    <ProfileChoices>
                        <button onClick={onJoinClick} style={{ padding: '0.5rem 1rem' }}>Join</button>
                        <button onClick={() => setSelectedOrgId(null)} style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                    </ProfileChoices>
                </PasswordBox>
            )}

            <div style={{ marginTop: '3rem', borderTop: '1px solid magenta', paddingTop: '2rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {!isCreating ? (
                    <NewOrgButton
                        onClick={() => setIsCreating(true)}
                    >
                        Create New Organization
                    </NewOrgButton>
                ) : (
                    <InputBox>
                        <h3>Create New Organization</h3>
                        <input
                            type="text"
                            placeholder="Organization Name"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            style={{ marginBottom: '0.5rem' }}
                        />
                        <input
                            type="password"
                            placeholder="Set Password"
                            value={newOrgPassword}
                            onChange={(e) => setNewOrgPassword(e.target.value)}
                        />
                        <ProfileChoices>
                            <button onClick={onCreateClick}>Create</button>
                            <button onClick={() => setIsCreating(false)}>Cancel</button>
                        </ProfileChoices>
                    </InputBox>
                )}
            </div>
        </div>
    );
};
