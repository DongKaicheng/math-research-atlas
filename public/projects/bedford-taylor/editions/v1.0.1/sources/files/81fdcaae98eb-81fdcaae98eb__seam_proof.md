# A full-test sphere compensator for small nonradial Dirichlet data

Status: PROVED-INTERNAL derivation in the specified toric sector, submitted to the root for separate review. This is not general C2. Dependencies are the verified classical Dirichlet/Schauder construction, elementary Hessian/Newton identities proved below, frozen bounded-BT local uniform continuity, and frozen smooth full-test Gauss calibration. No arbitrary-psh pushforward formula is assumed.

## 1. Setup and statement

Use the parent's actual reference w, equal to p(x)=(|x|²−L²)/2 on B_{2R}, on the same ordinary torus representative V, with S=β^{n−q}[X], n≥2 and 2≤q≤n. Let z∈C^{2,α}(Bbar_R) satisfy z=0 on ∂B_R and

    I+D²z≥cI>0,     ||D²z||op≤r<1/2.

Write b=∂νz on the sphere and f=σ_q(I+D²z)−binom(n,q). Initially z can be any such known Dirichlet function; later z=z(f) is the already constructed Picard limit for prescribed small f. Define ztilde=z inside B_R and zero outside, and U=w+ztilde. It is continuous. All assertions below about the original BT source assume b≤0, which ensures convexity. The exact density is

    J(b)= C1 R/q [1−(1+b/R)^q],  C1=binom(n−1,q−1).       (S1)

Then, on all original compact smooth scalar tests,

    μ_U=μ_w+K_q σ_*(f 1_{B_R} dx + J(b) dS_{∂B_R}),
    K_q=q!(n−q)!.                                       (S2)

The surface term is essential. It vanishes exactly when b=0. All forms, measures, coordinates, field and absolute value remain the original ones, but the result uses this specified smooth toric background.

## 2. Classical geometry and convexity at the sphere

On the sphere, tangential derivatives of z vanish and ∇z=bν. For a unit tangent vector e, choose a unit-speed great-circle curve γ with γ(0)=x, γ′(0)=e and γ″(0)=−ν/R. Twice differentiating z(γ)=0 gives

    D²z(e,e)=b/R.

Polarization gives D²z|_{T∂B}=(b/R)I. In particular |b|/R≤r. The inside Hessian of v=p+z is positive definite; outside v=p. Across the sphere the gradient jump (outside minus inside) is −bν. Its distribution Hessian is therefore

    D²v = (I+1_B D²z) dx + (−b) ν⊗ν dS.                (S3)

One can verify (S3) by integrating the first derivatives by parts on the two sides; continuity of v prevents any derivative-of-surface term. Thus b≤0 makes this matrix-valued distribution positive, and v is convex on B_{2R}. Conversely, if the glued function is convex, restriction to each normal line gives outside slope at least inside slope, hence b≤0. This equivalence uses the fixed exterior p.

The convex local function glues to w because it equals p on the open annulus R<|x|<2R. Negativity is preserved by the separate small uniform bound on z; boundary values and all actual-core qualifications are the same as the parent's construction. If the scheme is used outside this uniform budget, negativity must be checked rather than inferred from convexity alone.

## 3. Newton divergence and the smoothing estimate

Let T_{q−1}(A) be the matrix derivative of σ_q at a symmetric matrix A. For smooth v,

    tr(T_{q−1}(D²v) D²v)=q σ_q(D²v),
    div T_{q−1}(D²v)=0.

The first identity is Euler's identity for the homogeneous polynomial. For the second, expand T through alternating generalized Kronecker symbols; differentiating each Hessian factor produces a third derivative symmetric in the differentiated and row indices, while the alternating symbol changes sign under their exchange. Terms cancel. Hence

    q σ_q(D²v)=div F_v,
    F_v=T_{q−1}(D²v)∇v.                                (S4)

We justify the distributional limit of this flux, rather than multiplying singular Hessians. Let v_ε=v*ρ_ε on a protected subball of B_{2R}, with a nonnegative smooth compactly supported mollifier. It is smooth convex and converges locally uniformly to v. Formula (S3) gives its Hessian. In the ε-neighborhood of the sphere, use the orthonormal frame with last vector ν(x)=x/|x|. If y is on the sphere with |y−x|≤ε, its normal has tangential components O(ε/R) in this frame. The mollified surface measure has total density O(ε⁻¹). Consequently the surface contribution to the nn Hessian block is O(ε⁻¹), its mixed block is O(1), and its tangential block is O(ε); adding bounded bulk gives

    (D²v_ε)nn=O(ε⁻¹),
    (D²v_ε)nT=O(1),    (D²v_ε)TT=O(1).                  (S5)

All constants here are uniform in ε on a fixed protected neighborhood and may depend on R and the C² bounds. Also ∇_T v_ε=O(ε) in that layer: on the sphere v is constant, so the two classical gradients there are normal; moving a distance O(ε) changes their tangential components by O(ε), including the O(ε/R) change of normal direction. The normal gradient is O(1).

Each Newton-tensor entry is a sum of minors. Its nn entry involves only tangential Hessian entries, so is O(1). Its nT entries are also O(1): an off-diagonal derivative minor with one excluded normal row/column cannot contain the nn entry. The TT block is O(ε⁻¹), since a minor contains the nn entry at most once. Thus

    F_{v_ε}=T_{q−1}(D²v_ε)∇v_ε=O(1)                  (S6)

even in the layer: the only potentially O(ε⁻¹) block multiplies an O(ε) tangential gradient. Away from the sphere, convolution converges in C² locally to the classical pieces; the thin layer has volume O(ε). Therefore F_{v_ε} converges in local L¹ to the piecewise classical flux F_v.

Passing to distributions in (S4) is now justified. The divergence of a piecewise continuous flux has boundary part (F_out−F_in)·ν dS. On the sphere,

    ∇v_in=(R+b)ν,
    (D²v_in)|_T=(1+b/R)I,
    T_{q−1}(D²v_in)ν·ν=C1(1+b/R)^{q−1}.

Mixed Hessian entries do not enter this normal-normal cofactor. Consequently

    F_in·ν=C1 R(1+b/R)^q,       F_out·ν=C1 R,

and the boundary density of σ_q is exactly J(b) in (S1). The interior density is binom(n,q)+f; outside it is binom(n,q).

Because the v_ε are convex, σ_q(D²v_ε) dx are positive. Their mass on every protected compact set is uniformly bounded: test (S4) against a smooth cutoff equal to one there and use (S6), which holds globally on that compact region. Distribution convergence therefore improves to vague convergence against arbitrary continuous compactly supported real tests. This step is needed for η∘σ, which need not be an ordinary smooth function in these moment coordinates.

## 4. Transfer to all original tests

For each smooth toric v_ε the retained smooth calibration gives the full source measure K_q σ_*(σ_q(D²v_ε)dx), paired against every original compact smooth scalar η. On the moment patch the corresponding real test is the continuous function η∘σ. The vague convergence just proved passes this right-hand side to the bulk-plus-surface formula. Frozen bounded-BT continuity under local uniform convergence of continuous psh potentials passes the left-hand side to the source of v. A compact moment cutoff equal to one near Bbar_R separates this computation from the unchanged exterior w, proving (S2).

No replacement of the original test class is made. The proof derives this nonsmooth toric formula from smooth approximants with a controlled interface. It does not assert a general nonlinear pushforward theorem for all psh potentials.

## 5. Prescribed negative bulk data produce a positive seam compensator

Take any sufficiently small prescribed f∈C^{0,α}(Bbar_R) with f≤0. The preceding Picard construction produces a unique small z=z(f), with positive Hessian and zero Dirichlet data. Since

    f=F(z)−F(0)=a^{ij}∂ijz,

where a is the integrated Newton tensor along I+tD²z and is uniformly positive, the classical minimum principle gives z≥0. The elementary one-sided derivative at the zero boundary then gives b≤0. Hence U is actual convex/psh and (S2) applies. The data on the right are positive independently of any optimizer: the bulk density binom(n,q)+f stays positive by the small norm condition, J(b)≥0, and the exterior source is unchanged. The normal trace b is evaluated from the explicit convergent Dirichlet iteration with its previously proved error bounds.

This describes a prescribed bulk perturbation with a determined compensating sphere measure. It does NOT solve the seam-free equation with datum μ_w+K_qσ_*(f dx). It is not a finite-test characterization, since evaluating b exactly may involve an infinite limit. The construction avoids an unknown nonlinear optimizer but still uses the established local nonlinear Dirichlet solve as a computational procedure.

Integrating (S4), or simply comparing its unchanged outer flux, gives the exact balance

    ∫_B f dx + ∫_∂B J(b)dS=0.                           (S7)

For a check, if f is the small negative constant f0, set k=(1+f0/binom(n,q))^{1/q}−1 and z=k(|x|²−R²)/2. Then b=kR and J=−Rf0/n; (S7) follows from |B_R|=R|∂B_R|/n. This is a calibration check, not a substitute for the nonradial proof.

## 6. Strengthened obstruction for the previous straight data line

For f_s=s C1Δ(x1χ(|x|)), the separate audited expansion proves b(f_s)≠0 for all sufficiently small nonzero s. It also has ∫_B f_s=0. Apply the classical inside flux identity, which is valid without any sign assumption on b:

    ∫_B f_s dx=C1 R/q ∫_∂B[(1+b/R)^q−1]dS=0.          (S8)

Because 1+b/R>0 and b is continuous and nonzero, (S8) forces b to take both positive and negative values. In particular the unique small interior Dirichlet solution cannot be convexly glued to the unchanged quadratic exterior: positivity of b at any point violates the one-dimensional convexity condition.

The separate comparison argument identifies every C² convex interior Dirichlet solution with this small solution; it does not require the competitor to be small. Thus there is no actual correction whose real moment profile is C² on the closed fixed ball, convex after gluing to the specified exterior, and has the desired seam-free source. This removes the explicit clamped assumption in that profile class. It does not address non-toric original potentials, general completed solutions, weaker profiles not covered by a comparison theorem, or modified exterior values.

For a general small datum, (S1) separately shows that a convex gluing with no sphere source must have b=0: J≥0 and J=0 exactly at b=0. This implication remains restricted to the piecewise C² profile class just proved.
