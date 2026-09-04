import { useNavigate } from '@tanstack/react-router'
import { DropdownMenu } from '@cloudflare/kumo'
import { useEffect, useState } from 'react'
import {
  type FamilyState,
  FAMILY_ADULT_PASSCODE_LENGTH,
  isFamilyAdultPasscode,
} from '@gadgets/workshop-shared/api'
import { useAuthenticatedApi } from '../AuthContext'
import { applyFamilyRpcResult, handleFamilyRpcFailure } from '../familyRpc'
import { announceFamilyProfileChanged } from '../familyProfileEvents'
import { familyLabel, familyUi, isFamilyMode } from '../familyUi'
import FamilyMonsterPicker from './FamilyMonsterPicker'
import { MENU_CONTENT, MENU_ITEM, MENU_ITEM_DANGER, MENU_POSITIONER_STYLE } from './menuStyles'

export default function UserMenu() {
  const { familyEntry, logout, isAdmin, isFamilyChild } = useAuthenticatedApi()
  const navigate = useNavigate()
  const [familyState, setFamilyState] = useState<FamilyState | null>(null)
  const [passcode, setPasscode] = useState('')
  const [childName, setChildName] = useState('')
  const [familyError, setFamilyError] = useState<string | null>(null)

  const avatarId = familyState?.activeProfile.kind === 'unselected'
    ? undefined
    : familyState?.activeProfile.monsterAvatarId
      ?? (familyState?.activeProfile.kind === 'adult' ? familyState.adultMonsterAvatarId : undefined)

  useEffect(() => {
    if (!familyEntry) {
      setFamilyState(null)
      return
    }
    let cancelled = false
    familyEntry.getState().then((state) => {
      if (!cancelled) setFamilyState(state)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [familyEntry])

  const handleFamilyError = (message: string) => {
    setFamilyError(message)
  }

  const setHouseholdPasscode = () => {
    if (!familyEntry) return
    if (!isFamilyAdultPasscode(passcode)) {
      setFamilyError(familyUi.passcodeMustBeDigits)
      return
    }
    void familyEntry.setHouseholdPasscode(passcode).then((result) => {
      applyFamilyRpcResult(result, (state) => {
        setFamilyState(state)
        setPasscode('')
        setFamilyError(null)
      }, handleFamilyError)
    })
  }


  const createChildProfile = () => {
    if (!familyEntry) return
    void familyEntry.createChildProfile(childName).then((result) => {
      applyFamilyRpcResult(result, (state) => {
        setFamilyState(state)
        setChildName('')
        setFamilyError(null)
      }, handleFamilyError)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        render={
          <button
            className="flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-kumo-tint transition-colors hover:bg-kumo-fill md:h-7 md:w-7"
            title={isFamilyMode ? familyUi.openProfileMenu : 'Open profile menu'}
            aria-label={isFamilyMode ? familyUi.openProfileMenu : 'Open profile menu'}
          >
            {avatarId ? (
              <img src={`/family-avatars/${avatarId}.png`} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-kumo-strong">{isFamilyMode ? '家' : 'F'}</span>
            )}
          </button>
        }
      />
      <DropdownMenu.Content className={MENU_CONTENT} style={MENU_POSITIONER_STYLE}>
        <DropdownMenu.Item
          onClick={() => navigate({ to: '/profile' })}
          className={MENU_ITEM}
        >
          {familyLabel('Profile', familyUi.profile)}
        </DropdownMenu.Item>
        {!isFamilyChild && (
          <DropdownMenu.Item
            onClick={() => navigate({ to: '/providers' })}
            className={MENU_ITEM}
          >
            {familyLabel('Providers', familyUi.providers)}
          </DropdownMenu.Item>
        )}
        {isAdmin && !isFamilyChild && (
          <DropdownMenu.Item
            onClick={() => navigate({ to: '/admin' })}
            className={MENU_ITEM}
          >
            {familyLabel('Admin', familyUi.admin)}
          </DropdownMenu.Item>
        )}
        {familyEntry && familyState && (
          <>
            <DropdownMenu.Separator />
            <div className="px-3 py-2 text-xs text-kumo-subtle" aria-live="polite">
              {familyState.activeProfile.kind === 'child'
                ? familyUi.childProfile(familyState.activeProfile.name)
                : familyUi.adultProfile}
            </div>
            {familyState.requiresAccessReauthentication ? (
              <DropdownMenu.Item onClick={() => window.location.assign('/cdn-cgi/access/logout')} className={MENU_ITEM}>
                {familyUi.reauthAccess}
              </DropdownMenu.Item>
            ) : familyState.activeProfile.kind === 'adult' ? (
              <>
                <div className="px-3 py-2 space-y-2">
                  <input value={passcode} onChange={(event) => setPasscode(event.target.value)}
                    inputMode="numeric" maxLength={FAMILY_ADULT_PASSCODE_LENGTH}
                    aria-label={familyUi.setPasscodePlaceholder}
                    placeholder={familyUi.setPasscodePlaceholder} className="w-full rounded border px-2 py-1" />
                  <button type="button" onClick={setHouseholdPasscode} className="text-xs text-kumo-brand">
                    {familyState.passcodeConfigured ? familyUi.setHouseholdPasscode : familyUi.setPasscode}
                  </button>
                </div>
                {familyState.passcodeConfigured && (
                  <div className="px-3 py-2 space-y-2">
                    <input value={childName} onChange={(event) => setChildName(event.target.value)}
                      aria-label={familyUi.childNamePlaceholder} placeholder={familyUi.childNamePlaceholder}
                      className="w-full rounded border px-2 py-1" />
                    <button type="button" onClick={createChildProfile} className="text-xs text-kumo-brand">
                      {familyUi.addChild}
                    </button>
                  </div>
                )}
                {familyState.childProfiles.map((profile) => (
                  <DropdownMenu.Item key={profile.id}
                    onClick={() => {
                      void familyEntry.selectChildProfile(profile.id).then((result) => {
                        if (!result.ok) handleFamilyRpcFailure(result.error, handleFamilyError)
                        else {
                          announceFamilyProfileChanged()
                          window.location.reload()
                        }
                      })
                    }}
                    className={MENU_ITEM}>
                    <span className="mr-2 inline-flex h-5 w-5 overflow-hidden rounded-full bg-kumo-fill">
                      {profile.monsterAvatarId ? (
                        <img src={`/family-avatars/${profile.monsterAvatarId}.png`} alt="" className="h-full w-full object-contain" />
                      ) : null}
                    </span>
                    {familyUi.useChildProfile(profile.name)}
                  </DropdownMenu.Item>
                ))}
              </>
            ) : (
              <div className="px-3 py-2 space-y-2">
                <input value={passcode} onChange={(event) => setPasscode(event.target.value)}
                  inputMode="numeric" maxLength={FAMILY_ADULT_PASSCODE_LENGTH} aria-label={familyUi.adultPasscode}
                  placeholder={familyUi.adultPasscode} className="w-full rounded border px-2 py-1" />
                <button type="button" onClick={() => {
                  void familyEntry.switchToAdultProfile(passcode).then((result) => {
                    if (!result.ok) handleFamilyRpcFailure(result.error, handleFamilyError)
                    else {
                      announceFamilyProfileChanged()
                      window.location.reload()
                    }
                  })
                }} className="text-xs text-kumo-brand">
                  {familyUi.switchToAdult}
                </button>
              </div>
            )}
            {familyError && <div className="px-3 py-2 text-xs text-kumo-danger">{familyError}</div>}
            <FamilyMonsterPicker
              className="px-3 py-2"
              selectedId={avatarId}
              onSelect={(id) => {
                void familyEntry.setMonsterAvatar(id).then((result) => {
                  applyFamilyRpcResult(result, setFamilyState, handleFamilyError)
                })
              }}
            />
          </>
        )}
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          variant="danger"
          onClick={logout}
          className={MENU_ITEM_DANGER}
        >
          {familyLabel('Sign out', familyUi.signOut)}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}
