use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("AiebTbnydag8QCPFhapiuPzd5hy8MvKNXeVVYR2dZ94Z");

#[program]
pub mod zk_escrow {
    use super::*;

    pub fn initialize_gift(
        ctx: Context<InitializeGift>,
        gift_id: String,
        amount: u64,
        recipient: Pubkey,
        bump: u8,
    ) -> Result<()> {
        require!(gift_id.len() <= 64, EscrowError::GiftIdTooLong);
        require!(amount > 0, EscrowError::InvalidAmount);

        let escrow_state = &mut ctx.accounts.escrow_state;
        escrow_state.sender = ctx.accounts.sender.key();
        escrow_state.recipient = recipient;
        escrow_state.amount = amount;
        escrow_state.gift_id = gift_id;
        escrow_state.claimed = false;
        escrow_state.bump = bump;
        escrow_state.vault = ctx.accounts.vault.key();

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.sender_token_account.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.sender.to_account_info(),
                },
            ),
            amount,
        )?;

        msg!("Gift initialized: {} USDC escrowed", amount);
        Ok(())
    }

    pub fn claim_gift(ctx: Context<ClaimGift>) -> Result<()> {
        let escrow_state = &ctx.accounts.escrow_state;
        
        require!(!escrow_state.claimed, EscrowError::AlreadyClaimed);
        require!(
            escrow_state.recipient == ctx.accounts.recipient.key(),
            EscrowError::UnauthorizedRecipient
        );

        let gift_id = escrow_state.gift_id.clone();
        let bump = escrow_state.bump;
        
        let seeds = &[b"escrow", gift_id.as_bytes(), &[bump]];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.recipient_token_account.to_account_info(),
                    authority: ctx.accounts.escrow_state.to_account_info(),
                },
                signer,
            ),
            escrow_state.amount,
        )?;

        let escrow_state = &mut ctx.accounts.escrow_state;
        escrow_state.claimed = true;

        msg!("Gift claimed: {} USDC transferred", escrow_state.amount);
        Ok(())
    }

    pub fn refund_gift(ctx: Context<RefundGift>) -> Result<()> {
        let escrow_state = &ctx.accounts.escrow_state;
        
        require!(!escrow_state.claimed, EscrowError::AlreadyClaimed);
        require!(
            escrow_state.sender == ctx.accounts.sender.key(),
            EscrowError::UnauthorizedSender
        );

        let gift_id = escrow_state.gift_id.clone();
        let bump = escrow_state.bump;
        
        let seeds = &[b"escrow", gift_id.as_bytes(), &[bump]];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.sender_token_account.to_account_info(),
                    authority: ctx.accounts.escrow_state.to_account_info(),
                },
                signer,
            ),
            escrow_state.amount,
        )?;

        msg!("Gift refunded: {} USDC returned to sender", escrow_state.amount);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(gift_id: String, amount: u64, recipient: Pubkey, bump: u8)]
pub struct InitializeGift<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + EscrowState::INIT_SPACE,
        seeds = [b"escrow", gift_id.as_bytes()],
        bump
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    #[account(
        init,
        payer = sender,
        token::mint = mint,
        token::authority = escrow_state,
        seeds = [b"vault", gift_id.as_bytes()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub sender: Signer<'info>,
    
    #[account(
        mut,
        constraint = sender_token_account.owner == sender.key(),
        constraint = sender_token_account.mint == mint.key()
    )]
    pub sender_token_account: Account<'info, TokenAccount>,
    
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimGift<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow_state.gift_id.as_bytes()],
        bump = escrow_state.bump,
        has_one = vault
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    #[account(
        mut,
        seeds = [b"vault", escrow_state.gift_id.as_bytes()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub recipient: Signer<'info>,
    
    #[account(
        mut,
        constraint = recipient_token_account.owner == recipient.key(),
        constraint = recipient_token_account.mint == vault.mint
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RefundGift<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow_state.gift_id.as_bytes()],
        bump = escrow_state.bump,
        has_one = vault,
        has_one = sender
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    #[account(
        mut,
        seeds = [b"vault", escrow_state.gift_id.as_bytes()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub sender: Signer<'info>,
    
    #[account(
        mut,
        constraint = sender_token_account.owner == sender.key(),
        constraint = sender_token_account.mint == vault.mint
    )]
    pub sender_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct EscrowState {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    #[max_len(64)]
    pub gift_id: String,
    pub claimed: bool,
    pub bump: u8,
    pub vault: Pubkey,
}

#[error_code]
pub enum EscrowError {
    #[msg("Gift ID cannot exceed 64 characters")]
    GiftIdTooLong,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Gift has already been claimed")]
    AlreadyClaimed,
    #[msg("Only the designated recipient can claim this gift")]
    UnauthorizedRecipient,
    #[msg("Only the sender can refund this gift")]
    UnauthorizedSender,
}
